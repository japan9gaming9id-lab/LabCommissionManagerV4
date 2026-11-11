package com.sam.labcommissionmanager;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) getWindow().setDecorFitsSystemWindows(true);
        getWindow().setStatusBarColor(Color.BLACK);
        getWindow().getDecorView().setSystemUiVisibility(0);

        webView = new WebView(this);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new AndroidBridge(this), "AndroidBridge");
        setContentView(webView);
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.evaluateJavascript("document.body.classList.remove('native-statement-print'); var s=document.getElementById('nativeStatementPrintStyle'); if(s) s.remove();", null);
        }
    }

    public class AndroidBridge {
        AndroidBridge(Context context) { }

        @JavascriptInterface
        public void savePdf(String base64Pdf, String fileName) {
            try {
                byte[] bytes = Base64.decode(base64Pdf, Base64.DEFAULT);
                String safeName = safePdfName(fileName);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.Downloads.DISPLAY_NAME, safeName);
                    values.put(MediaStore.Downloads.MIME_TYPE, "application/pdf");
                    values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                    Uri uri = MainActivity.this.getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    if (uri == null) throw new Exception("Download file create nahi hui");
                    try (OutputStream out = MainActivity.this.getContentResolver().openOutputStream(uri)) {
                        if (out == null) throw new Exception("File open nahi hui");
                        out.write(bytes);
                    }
                } else {
                    File dir = MainActivity.this.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    if (dir == null) throw new Exception("Downloads folder unavailable");
                    try (FileOutputStream out = new FileOutputStream(new File(dir, safeName))) { out.write(bytes); }
                }
                toast("PDF Downloads folder mein save ho gayi.");
            } catch (Exception e) { toast("PDF save nahi hui: " + e.getMessage()); }
        }

        @JavascriptInterface
        public void sharePdf(String base64Pdf, String fileName) {
            try {
                byte[] bytes = Base64.decode(base64Pdf, Base64.DEFAULT);
                File dir = new File(MainActivity.this.getCacheDir(), "shared_pdfs");
                if (!dir.exists() && !dir.mkdirs()) throw new Exception("Temporary folder unavailable");
                File file = new File(dir, safePdfName(fileName));
                try (FileOutputStream out = new FileOutputStream(file)) { out.write(bytes); }
                Uri uri = FileProvider.getUriForFile(MainActivity.this, MainActivity.this.getPackageName() + ".fileprovider", file);
                Intent intent = new Intent(Intent.ACTION_SEND);
                intent.setType("application/pdf");
                intent.putExtra(Intent.EXTRA_STREAM, uri);
                intent.setClipData(android.content.ClipData.newUri(MainActivity.this.getContentResolver(), "Commission Statement", uri));
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                MainActivity.this.startActivity(Intent.createChooser(intent, "Share Commission Statement"));
            } catch (Exception e) { toast("PDF share nahi hui: " + e.getMessage()); }
        }

        @JavascriptInterface
        public void printStatement() {
            MainActivity.this.runOnUiThread(() -> {
                try {
                    PrintManager manager = (PrintManager) MainActivity.this.getSystemService(Context.PRINT_SERVICE);
                    if (manager == null) throw new Exception("Print service unavailable");
                    PrintAttributes attributes = new PrintAttributes.Builder()
                        .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                        .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
                        .build();
                    manager.print("Commission Statement", webView.createPrintDocumentAdapter("Commission Statement"), attributes);
                } catch (Exception e) { toast("Print preview nahi khula: " + e.getMessage()); }
            });
        }

        private void toast(String message) {
            MainActivity.this.runOnUiThread(() -> Toast.makeText(MainActivity.this, message, Toast.LENGTH_LONG).show());
        }

        private String safePdfName(String name) {
            String result = (name == null ? "Commission_Statement.pdf" : name).replaceAll("[\\\\/:*?\"<>|]", "_");
            return result.toLowerCase().endsWith(".pdf") ? result : result + ".pdf";
        }
    }
}
