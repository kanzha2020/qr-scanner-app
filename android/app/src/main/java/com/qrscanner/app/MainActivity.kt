package com.qrscanner.app

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.location.Location
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.Settings
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import com.qrscanner.app.databinding.ActivityMainBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var cameraExecutor: ExecutorService
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var apiService: ApiService

    private var isProcessing = false  // Prevent duplicate scans
    private var lastScannedContent = ""
    private var lastScanTime = 0L

    companion object {
        private const val TAG = "BarcodeScanner"
        private const val PERMISSION_REQUEST_CODE = 100
        private const val SCAN_COOLDOWN_MS = 1000L  // 1-second cooldown between same barcode scans
        private const val GLOBAL_SCAN_COOLDOWN_MS = 500L  // 0.5-second cooldown between any scans

        private val REQUIRED_PERMISSIONS = arrayOf(
            Manifest.permission.CAMERA,
            Manifest.permission.ACCESS_FINE_LOCATION
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Initialize services
        cameraExecutor = Executors.newSingleThreadExecutor()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        apiService = ApiService.create()

        // Setup UI
        binding.statusText.text = "Initializing..."
        binding.scanCountText.text = "Scans: 0"

        // Check permissions and start camera
        if (allPermissionsGranted()) {
            startCamera()
        } else {
            requestPermissions()
        }
    }

    // ─── Permissions ─────────────────────────────────────────────

    private fun allPermissionsGranted() = REQUIRED_PERMISSIONS.all {
        ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
    }

    private fun requestPermissions() {
        ActivityCompat.requestPermissions(this, REQUIRED_PERMISSIONS, PERMISSION_REQUEST_CODE)
    }

    override fun onRequestPermissionsResult(
        requestCode: Int, permissions: Array<String>, grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (allPermissionsGranted()) {
                startCamera()
            } else {
                binding.statusText.text = "Camera & Location permissions are required"
                Toast.makeText(this, "Permissions not granted.", Toast.LENGTH_LONG).show()
            }
        }
    }

    // ─── Camera & Barcode Scanning ─────────────────────────────

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)

        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()

            // Preview use case
            val preview = Preview.Builder()
                .build()
                .also { it.setSurfaceProvider(binding.previewView.surfaceProvider) }

            // Image analysis use case for barcode scanning (1D + 2D)
            val imageAnalysis = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also {
                    it.setAnalyzer(cameraExecutor) { imageProxy ->
                        processImage(imageProxy)
                    }
                }

            // Select back camera
            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageAnalysis)
                runOnUiThread {
                    binding.statusText.text = "Ready to scan"
                    binding.statusIndicator.setBackgroundColor(
                        ContextCompat.getColor(this, android.R.color.holo_green_dark)
                    )
                }
            } catch (e: Exception) {
                Log.e(TAG, "Camera binding failed", e)
                runOnUiThread {
                    binding.statusText.text = "Camera error: ${e.message}"
                }
            }
        }, ContextCompat.getMainExecutor(this))
    }

    @SuppressLint("UnsafeOptInUsageError")
    private fun processImage(imageProxy: ImageProxy) {
        val mediaImage = imageProxy.image
        if (mediaImage == null || isProcessing) {
            imageProxy.close()
            return
        }

        // Early global cooldown check: skip scanning entirely if within cooldown
        val currentTimeMs = System.currentTimeMillis()
        if ((currentTimeMs - lastScanTime) < GLOBAL_SCAN_COOLDOWN_MS) {
            imageProxy.close()
            return
        }

        val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
        val options = BarcodeScannerOptions.Builder()
            .setBarcodeFormats(
                Barcode.FORMAT_ALL_FORMATS
            )
            .build()
        val scanner = BarcodeScanning.getClient(options)

        // Capture image dimensions for coordinate mapping
        val imageWidth: Int
        val imageHeight: Int
        val rotation = imageProxy.imageInfo.rotationDegrees
        if (rotation == 90 || rotation == 270) {
            imageWidth = mediaImage.height
            imageHeight = mediaImage.width
        } else {
            imageWidth = mediaImage.width
            imageHeight = mediaImage.height
        }

        scanner.process(image)
            .addOnSuccessListener { barcodes ->
                for (barcode in barcodes) {
                    if (barcode.valueType == Barcode.TYPE_URL ||
                        barcode.valueType == Barcode.TYPE_TEXT ||
                        barcode.rawValue != null
                    ) {
                        val content = barcode.rawValue ?: continue

                        // Filter: only accept barcodes within the scan frame region
                        if (!isBarcodeInScanFrame(barcode, imageWidth, imageHeight)) {
                            continue
                        }

                        val now = System.currentTimeMillis()

                        // Cooldown: skip if same barcode scanned within cooldown period
                        if (content == lastScannedContent && (now - lastScanTime) < SCAN_COOLDOWN_MS) {
                            continue
                        }

                        // Re-check global cooldown inside async callback in case
                        // another scan was processed while ML Kit was running
                        if ((now - lastScanTime) < GLOBAL_SCAN_COOLDOWN_MS) {
                            continue
                        }

                        lastScannedContent = content
                        lastScanTime = now
                        isProcessing = true

                        runOnUiThread {
                            binding.statusText.text = "Barcode Detected! Getting location..."
                            binding.statusIndicator.setBackgroundColor(
                                ContextCompat.getColor(this, android.R.color.holo_orange_dark)
                            )
                            vibrateDevice()
                        }

                        handleBarcodeDetected(content)
                        break  // Process only the first barcode found
                    }
                }
            }
            .addOnFailureListener { e ->
                Log.e(TAG, "Barcode scanning failed", e)
            }
            .addOnCompleteListener {
                imageProxy.close()
            }
    }

    /**
     * Checks whether a detected barcode's bounding box center falls within the
     * scan frame region of the overlay. Maps barcode coordinates from image space
     * to the overlay view's coordinate space.
     */
    private fun isBarcodeInScanFrame(barcode: Barcode, imageWidth: Int, imageHeight: Int): Boolean {
        val boundingBox = barcode.boundingBox ?: return false
        val overlay = binding.scanOverlay
        val overlayWidth = overlay.width
        val overlayHeight = overlay.height

        if (overlayWidth == 0 || overlayHeight == 0 || imageWidth == 0 || imageHeight == 0) {
            return true // Allow scan if dimensions not yet available
        }

        val frameRect = overlay.getFrameRect()
        if (frameRect.isEmpty) {
            return true // Allow scan if frame not yet drawn
        }

        // Map barcode center from image coordinates to overlay coordinates
        val scaleX = overlayWidth.toFloat() / imageWidth.toFloat()
        val scaleY = overlayHeight.toFloat() / imageHeight.toFloat()
        val barcodeCenterX = boundingBox.centerX() * scaleX
        val barcodeCenterY = boundingBox.centerY() * scaleY

        return frameRect.contains(barcodeCenterX, barcodeCenterY)
    }

    // ─── Barcode Detected → Get Location → Upload ─────────────

    private fun handleBarcodeDetected(barcodeContent: String) {
        getLocation { location ->
            val scanTime = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }.format(Date())

            val deviceId = getCustomDeviceId()

            val scanResult = ScanResult(
                qrContent = barcodeContent,
                latitude = location?.latitude ?: 0.0,
                longitude = location?.longitude ?: 0.0,
                scanTime = scanTime,
                deviceId = deviceId
            )

            uploadScan(scanResult)
        }
    }

    @SuppressLint("MissingPermission")
    private fun getLocation(callback: (Location?) -> Unit) {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED
        ) {
            callback(null)
            return
        }

        val cancellationToken = CancellationTokenSource()
        fusedLocationClient.getCurrentLocation(
            Priority.PRIORITY_HIGH_ACCURACY,
            cancellationToken.token
        ).addOnSuccessListener { location ->
            callback(location)
        }.addOnFailureListener { e ->
            Log.e(TAG, "Location failed", e)
            // Fallback: try last known location
            fusedLocationClient.lastLocation.addOnSuccessListener { lastLocation ->
                callback(lastLocation)
            }.addOnFailureListener {
                callback(null)
            }
        }
    }

    @SuppressLint("HardwareIds")
    private fun getCustomDeviceId(): String {
        val androidId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
        return "XCover7Pro_${androidId.takeLast(6)}"
    }

    // ─── Upload to Server ────────────────────────────────────────

    private fun uploadScan(scanResult: ScanResult) {
        runOnUiThread {
            binding.statusText.text = "Uploading to server..."
            binding.uploadProgress.visibility = View.VISIBLE
        }

        lifecycleScope.launch {
            try {
                val response = withContext(Dispatchers.IO) {
                    apiService.uploadScan(scanResult)
                }

                if (response.isSuccessful) {
                    val body = response.body()
                    showConfirmationDialog(scanResult, body)
                    incrementScanCount()
                } else {
                    showErrorDialog("Server returned error: ${response.code()}\n${response.message()}")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Upload failed", e)
                showErrorDialog("Upload failed: ${e.message}\n\nCheck server URL and connectivity.")
            } finally {
                withContext(Dispatchers.Main) {
                    binding.uploadProgress.visibility = View.GONE
                    binding.statusIndicator.setBackgroundColor(
                        ContextCompat.getColor(this@MainActivity, android.R.color.holo_green_dark)
                    )
                    binding.statusText.text = "Ready to scan"
                    isProcessing = false
                }
            }
        }
    }

    // ─── UI Feedback ─────────────────────────────────────────────

    private fun showConfirmationDialog(scanResult: ScanResult, response: ScanResponse?) {
        runOnUiThread {
            val message = """
                Time: ${scanResult.scanTime}
                
                Server ID: ${response?.id ?: "N/A"}
            """.trimIndent()

            AlertDialog.Builder(this)
                .setTitle("✅ Upload Successful")
                .setMessage(message)
                .setPositiveButton("OK") { dialog, _ ->
                    dialog.dismiss()
                }
                .setCancelable(true)
                .show()
        }
    }

    private fun showErrorDialog(message: String) {
        runOnUiThread {
            AlertDialog.Builder(this)
                .setTitle("❌ Upload Failed")
                .setMessage(message)
                .setPositiveButton("OK") { dialog, _ ->
                    dialog.dismiss()
                    isProcessing = false
                }
                .setCancelable(true)
                .show()
        }
    }

    private var scanCount = 0
    private fun incrementScanCount() {
        scanCount++
        runOnUiThread {
            binding.scanCountText.text = "Scans: $scanCount"
        }
    }

    private fun vibrateDevice() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = getSystemService(VIBRATOR_MANAGER_SERVICE) as VibratorManager
                val vibrator = vibratorManager.defaultVibrator
                vibrator.vibrate(VibrationEffect.createOneShot(200, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                val vibrator = getSystemService(VIBRATOR_SERVICE) as Vibrator
                vibrator.vibrate(VibrationEffect.createOneShot(200, VibrationEffect.DEFAULT_AMPLITUDE))
            }
        } catch (e: Exception) {
            Log.w(TAG, "Vibration failed", e)
        }
    }

    // ─── Lifecycle ───────────────────────────────────────────────

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }
}
