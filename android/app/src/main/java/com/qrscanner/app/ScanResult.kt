package com.qrscanner.app

import com.google.gson.annotations.SerializedName

/**
 * Data class representing a QR scan result to be uploaded to the server.
 */
data class ScanResult(
    @SerializedName("qr_content")
    val qrContent: String,

    @SerializedName("latitude")
    val latitude: Double,

    @SerializedName("longitude")
    val longitude: Double,

    @SerializedName("scan_time")
    val scanTime: String,

    @SerializedName("device_id")
    val deviceId: String
)

/**
 * Server response after uploading a scan.
 */
data class ScanResponse(
    @SerializedName("status")
    val status: String,

    @SerializedName("message")
    val message: String,

    @SerializedName("id")
    val id: Int
)
