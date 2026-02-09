package com.qrscanner.app

import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.View

/**
 * Custom overlay view that draws a semi-transparent mask over the camera preview,
 * with a clear chamfered rectangular cutout in the center for the scan region.
 */
class ScannerOverlayView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val maskPaint = Paint().apply {
        color = Color.parseColor("#99000000") // 60% black overlay
        style = Paint.Style.FILL
        isAntiAlias = true
    }

    private val framePaint = Paint().apply {
        color = Color.parseColor("#80FFFFFF") // 50% white border (matches original scan_frame.xml)
        style = Paint.Style.STROKE
        strokeWidth = 3f * resources.displayMetrics.density // 3dp
        isAntiAlias = true
    }

    private val frameRect = RectF()
    private val framePath = Path()
    private val maskPath = Path()

    private val frameSizeDp = 260f
    private val cornerRadiusDp = 16f

    /** Returns the scan frame rectangle in view coordinates. */
    fun getFrameRect(): RectF = RectF(frameRect)

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val density = resources.displayMetrics.density
        val frameSizePx = frameSizeDp * density
        val cornerRadiusPx = cornerRadiusDp * density

        // Center the frame in this view
        val left = (width - frameSizePx) / 2f
        val top = (height - frameSizePx) / 2f
        val right = left + frameSizePx
        val bottom = top + frameSizePx
        frameRect.set(left, top, right, bottom)

        // Build the cutout path (rounded rectangle)
        framePath.reset()
        framePath.addRoundRect(frameRect, cornerRadiusPx, cornerRadiusPx, Path.Direction.CW)

        // Draw the dark mask with the cutout
        maskPath.reset()
        maskPath.addRect(0f, 0f, width.toFloat(), height.toFloat(), Path.Direction.CW)
        maskPath.op(framePath, Path.Op.DIFFERENCE)
        canvas.drawPath(maskPath, maskPaint)

        // Draw the frame border
        canvas.drawRoundRect(frameRect, cornerRadiusPx, cornerRadiusPx, framePaint)
    }
}
