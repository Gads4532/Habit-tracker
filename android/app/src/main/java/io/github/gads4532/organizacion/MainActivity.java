package io.github.gads4532.organizacion;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Message;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Base64;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.browser.customtabs.CustomTabColorSchemeParams;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.core.app.NotificationManagerCompat;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Organización Personal para Android: una actividad propia con un WebView que carga la app web publicada.
 * Al ser un paquete propio, Android cuenta el tiempo de uso a esta app (Bienestar digital, StayFocused...)
 * y no a Chrome, como pasa con la app instalada desde Chrome.
 * Todo lo que no sea la app (Google, Notion, correo, WhatsApp...) se abre fuera: en la app que lo abra o en una pestaña de Chrome.
 */
public class MainActivity extends Activity {

    static final String HOST = "gads4532.github.io";
    static final String PATH = "/Habit-tracker/";
    static final String HOME = "https://" + HOST + PATH;
    static final String UA_SUFIJO = " OrgPersonalAndroid/1";
    static final int REQ_ARCHIVO = 41;
    static final int REQ_AVISOS = 42;

    private WebView web;
    private FrameLayout root;
    private TextView sinRed;
    private ValueCallback<Uri[]> archivoCb;
    private int fondo = Color.WHITE;
    // La página principal es la app (https://gads4532.github.io/Habit-tracker/...): solo entonces el puente programa avisos o guarda archivos.
    private volatile boolean enLaApp = false;
    private boolean cargada = false;
    private String accionPendiente = null;   // «✓ Hecho» / «+5 min» tocado antes de que la página termine de cargar

    // Se inyecta al terminar de cargar cada página de la app: guarda las descargas blob:/data: (la copia de seguridad .json)
    // con el puente OrgAndroid y avisa del color de fondo para pintar igual las barras del sistema.
    private static final String JS_PUENTE = "(function(){if(window.__opAndroid)return;window.__opAndroid=1;"
            + "function bajar(a){try{var h=a.href||'';if(!a.hasAttribute('download')||!/^(blob|data):/.test(h))return false;"
            + "var n=a.getAttribute('download')||'archivo';fetch(h).then(function(r){return r.blob()}).then(function(b){var f=new FileReader();"
            + "f.onload=function(){var s=String(f.result);OrgAndroid.guardar(s.slice(s.indexOf(',')+1),b.type||'application/octet-stream',n)};f.readAsDataURL(b)});return true}catch(e){return false}}"
            + "var C=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(bajar(this))return;return C.apply(this,arguments)};"
            + "document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[download]');if(a&&bajar(a))e.preventDefault()},true);"
            + "function tema(){try{var c=getComputedStyle(document.body).backgroundColor;if(!c||/rgba\\(0, 0, 0, 0\\)|transparent/.test(c))c=getComputedStyle(document.documentElement).backgroundColor;OrgAndroid.tema(String(c))}catch(e){}}"
            + "tema();new MutationObserver(tema).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','class','style']});"
            + "try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',tema)}catch(e){}"
            + "})();";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        boolean noche = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        fondo = noche ? Color.parseColor("#0E0E0E") : Color.WHITE;

        root = new FrameLayout(this);
        root.setBackgroundColor(fondo);
        web = new WebView(this);
        web.setBackgroundColor(fondo);
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        sinRed = new TextView(this);
        sinRed.setText(R.string.sin_red);
        sinRed.setGravity(Gravity.CENTER);
        sinRed.setTextSize(16);
        sinRed.setPadding(48, 48, 48, 48);
        sinRed.setTextColor(noche ? Color.parseColor("#F2F2F2") : Color.parseColor("#111111"));
        sinRed.setBackgroundColor(fondo);
        sinRed.setVisibility(View.GONE);
        sinRed.setOnClickListener(v -> { sinRed.setVisibility(View.GONE); web.reload(); });
        root.addView(sinRed, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
        bordeABorde();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);          // localStorage (los datos de la app) e IndexedDB
        s.setDatabaseEnabled(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setSupportMultipleWindows(true);     // window.open y target=_blank llegan a onCreateWindow y se abren fuera
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        s.setAllowFileAccess(false);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setUserAgentString(s.getUserAgentString() + UA_SUFIJO);   // la app web lo detecta (OrgPersonalAndroid)
        CookieManager.getInstance().setAcceptCookie(true);

        web.addJavascriptInterface(new Puente(), "OrgAndroid");
        web.setWebViewClient(new Cliente());
        web.setWebChromeClient(new Cromo());
        web.setDownloadListener((url, ua, disp, mime, largo) -> descargar(url, ua, disp, mime));

        if (saved == null || web.restoreState(saved) == null) web.loadUrl(HOME);
        if (saved == null && (getIntent().getFlags() & Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) == 0) accionDelAviso(getIntent());   // no al volver desde Recientes
    }

    // ---------- La app de borde a borde, con el color de fondo de la app detrás de las barras y el contenido entre ellas.
    @SuppressWarnings("deprecation")
    private void bordeABorde() {
        Window w = getWindow();
        if (Build.VERSION.SDK_INT >= 30) w.setDecorFitsSystemWindows(false);
        else root.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        root.setOnApplyWindowInsetsListener((v, ins) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                Insets i = ins.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.ime() | WindowInsets.Type.displayCutout());
                v.setPadding(i.left, i.top, i.right, i.bottom);
                return WindowInsets.CONSUMED;
            }
            v.setPadding(ins.getSystemWindowInsetLeft(), ins.getSystemWindowInsetTop(), ins.getSystemWindowInsetRight(), ins.getSystemWindowInsetBottom());
            return ins.consumeSystemWindowInsets();
        });
        pintarBarras();
    }

    @SuppressWarnings("deprecation")
    private void pintarBarras() {
        Window w = getWindow();
        boolean claro = Color.luminance(fondo) > 0.5f;
        root.setBackgroundColor(fondo);
        web.setBackgroundColor(fondo);
        if (Build.VERSION.SDK_INT < 35) {
            w.setStatusBarColor(Color.TRANSPARENT);
            // Antes de Android 8 los iconos de la barra de navegación son siempre claros: con fondo claro, la barra va oscura.
            w.setNavigationBarColor(Build.VERSION.SDK_INT < 26 && claro ? Color.BLACK : Color.TRANSPARENT);
        }
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = w.getInsetsController();
            if (c != null) {
                int m = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                c.setSystemBarsAppearance(claro ? m : 0, m);
            }
        } else {
            int f = View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;
            if (claro) {
                f |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                if (Build.VERSION.SDK_INT >= 26) f |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
            root.setSystemUiVisibility(f);
        }
    }

    // ---------- Qué se queda dentro: solo https://gads4532.github.io/Habit-tracker/...
    static boolean esDeLaApp(Uri u) {
        if (u == null) return false;
        String p = u.getPath() == null ? "" : u.getPath();
        return "https".equalsIgnoreCase(u.getScheme()) && HOST.equalsIgnoreCase(u.getHost())
                && (p.startsWith(PATH) || p.equals("/Habit-tracker"));
    }

    // Fuera de la app: intent:, mailto:, tel:, whatsapp:... a su app; https a la app que lo abra (Android 11+) o a una pestaña de Chrome.
    void abrirFuera(Uri u) {
        if (u == null) return;
        String esq = u.getScheme() == null ? "" : u.getScheme().toLowerCase();
        try {
            if (esq.equals("intent")) {
                Intent i = Intent.parseUri(u.toString(), Intent.URI_INTENT_SCHEME);
                i.addCategory(Intent.CATEGORY_BROWSABLE);
                i.setComponent(null);
                i.setSelector(null);
                try { startActivity(i); }
                catch (ActivityNotFoundException e) {
                    String alt = i.getStringExtra("browser_fallback_url");
                    if (alt != null && URLUtil.isNetworkUrl(alt)) abrirFuera(Uri.parse(alt)); else aviso(getString(R.string.sin_app));
                }
                return;
            }
            if (esq.equals("http") || esq.equals("https")) {
                if (Build.VERSION.SDK_INT >= 30) {
                    try {
                        Intent i = new Intent(Intent.ACTION_VIEW, u);
                        i.addCategory(Intent.CATEGORY_BROWSABLE);
                        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REQUIRE_NON_BROWSER);
                        startActivity(i);
                        return;
                    } catch (ActivityNotFoundException ignored) { }
                }
                pestana(u);
                return;
            }
            if (esq.equals("javascript") || esq.equals("file") || esq.equals("content") || esq.equals("about") || esq.equals("blob") || esq.equals("data")) return;
            Intent i = new Intent(Intent.ACTION_VIEW, u);
            i.addCategory(Intent.CATEGORY_BROWSABLE);
            startActivity(i);
        } catch (ActivityNotFoundException e) {
            aviso(getString(R.string.sin_app));
        } catch (Exception e) {
            aviso(getString(R.string.sin_app));
        }
    }

    void pestana(Uri u) {
        try {
            CustomTabColorSchemeParams col = new CustomTabColorSchemeParams.Builder().setToolbarColor(fondo).setNavigationBarColor(fondo).build();
            CustomTabsIntent t = new CustomTabsIntent.Builder().setDefaultColorSchemeParams(col).setShowTitle(true).build();
            t.launchUrl(this, u);
        } catch (ActivityNotFoundException e) {
            try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (ActivityNotFoundException e2) { aviso(getString(R.string.sin_app)); }
        }
    }

    void aviso(String t) { runOnUiThread(() -> Toast.makeText(this, t, Toast.LENGTH_LONG).show()); }

    private class Cliente extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
            Uri u = r.getUrl();
            if (esDeLaApp(u)) return false;
            if (!r.isForMainFrame()) {
                String esq = u.getScheme() == null ? "" : u.getScheme().toLowerCase();
                if (esq.equals("http") || esq.equals("https") || esq.equals("about") || esq.equals("blob") || esq.equals("data")) return false;
            }
            abrirFuera(u);
            return true;
        }

        @Override
        public void onPageStarted(WebView v, String url, android.graphics.Bitmap f) {
            enLaApp = url != null && esDeLaApp(Uri.parse(url));
            cargada = false;
        }

        @Override
        public void doUpdateVisitedHistory(WebView v, String url, boolean recarga) {
            enLaApp = url != null && esDeLaApp(Uri.parse(url));
        }

        @Override
        public void onPageFinished(WebView v, String url) {
            enLaApp = url != null && esDeLaApp(Uri.parse(url));
            if (!enLaApp) return;
            v.evaluateJavascript(JS_PUENTE, null);
            cargada = true;
            if (accionPendiente != null) { v.evaluateJavascript(accionPendiente, null); accionPendiente = null; }
        }

        @Override
        public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
            if (r.isForMainFrame()) sinRed.setVisibility(View.VISIBLE);
        }
    }

    private class Cromo extends WebChromeClient {
        // window.open / target=_blank: una ventana temporal recoge la dirección y se abre fuera (o dentro, si es de la app).
        @Override
        public boolean onCreateWindow(WebView v, boolean dialogo, boolean gesto, Message msg) {
            WebView tmp = new WebView(MainActivity.this);
            tmp.setWebViewClient(new WebViewClient() {
                boolean hecho = false;
                @Override
                public boolean shouldOverrideUrlLoading(WebView w, WebResourceRequest r) { llevar(w, r.getUrl()); return true; }
                @Override
                public void onPageStarted(WebView w, String url, android.graphics.Bitmap f) {
                    if (url != null && !url.equals("about:blank")) llevar(w, Uri.parse(url));
                }
                void llevar(WebView w, Uri u) {
                    if (hecho) return;
                    hecho = true;
                    if (esDeLaApp(u)) web.loadUrl(u.toString()); else abrirFuera(u);
                    w.stopLoading();
                    w.post(w::destroy);
                }
            });
            WebView.WebViewTransport t = (WebView.WebViewTransport) msg.obj;
            t.setWebView(tmp);
            msg.sendToTarget();
            return true;
        }

        @Override
        public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
            if (archivoCb != null) archivoCb.onReceiveValue(null);
            archivoCb = cb;
            try {
                startActivityForResult(p.createIntent(), REQ_ARCHIVO);
            } catch (ActivityNotFoundException e) {
                archivoCb = null;
                aviso(getString(R.string.sin_app));
                return false;
            }
            return true;
        }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req == REQ_ARCHIVO) {
            if (archivoCb != null) archivoCb.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, data));
            archivoCb = null;
            return;
        }
        super.onActivityResult(req, res, data);
    }

    // ---------- Descargas http(s): al gestor de descargas del sistema. blob:/data: las guarda el puente (JS_PUENTE).
    void descargar(String url, String ua, String disp, String mime) {
        Uri u = Uri.parse(url);
        String esq = u.getScheme() == null ? "" : u.getScheme().toLowerCase();
        if (esq.equals("data")) {
            int coma = url.indexOf(',');
            if (coma > 0) {
                String cab = url.substring(5, coma);
                boolean b64 = cab.endsWith(";base64");
                String dato = url.substring(coma + 1);
                String m = cab.split(";")[0];
                guardarBytes(b64 ? Base64.decode(dato, Base64.DEFAULT) : Uri.decode(dato).getBytes(), m.isEmpty() ? "application/octet-stream" : m, URLUtil.guessFileName(url, disp, m));
            }
            return;
        }
        if (!esq.equals("http") && !esq.equals("https")) return;   // blob: lo atiende el puente
        try {
            String nombre = URLUtil.guessFileName(url, disp, mime);
            DownloadManager.Request r = new DownloadManager.Request(u);
            r.setMimeType(mime);
            String c = CookieManager.getInstance().getCookie(url);
            if (c != null) r.addRequestHeader("Cookie", c);
            r.addRequestHeader("User-Agent", ua);
            r.setTitle(nombre);
            r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            if (Build.VERSION.SDK_INT >= 29) r.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, nombre);
            else r.setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS, nombre);
            DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
            dm.enqueue(r);
        } catch (Exception e) {
            abrirFuera(u);
        }
    }

    void guardarBytes(byte[] b, String mime, String nombre) {
        try {
            nombre = nombre.replaceAll("[\\\\/:*?\"<>|]", "_");
            if (Build.VERSION.SDK_INT >= 29) {
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.Downloads.DISPLAY_NAME, nombre);
                cv.put(MediaStore.Downloads.MIME_TYPE, mime);
                cv.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                Uri dest = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                if (dest == null) throw new Exception("sin destino");
                try (OutputStream o = getContentResolver().openOutputStream(dest)) { o.write(b); }
                aviso(getString(R.string.descargado) + ": " + nombre);
            } else {
                File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (dir == null) throw new Exception("sin carpeta");
                File f = new File(dir, nombre);
                try (FileOutputStream o = new FileOutputStream(f)) { o.write(b); }
                aviso(getString(R.string.descargado) + ": " + f.getAbsolutePath());
            }
        } catch (Exception e) {
            aviso(getString(R.string.no_descarga));
        }
    }

    // ---------- El puente que ve la página (window.OrgAndroid): guarda archivos, lee el color de fondo y programa el aviso del
    // temporizador. addJavascriptInterface lo expone a toda página que cargue el WebView: cada método que hace algo comprueba
    // que la página principal sea la app (enLaApp); lo de fuera se abre en otra app o en Chrome y no llega aquí.
    private class Puente {
        @JavascriptInterface
        public void guardar(String base64, String mime, String nombre) {
            if (!enLaApp) return;
            try { guardarBytes(Base64.decode(base64, Base64.DEFAULT), mime == null ? "application/octet-stream" : mime, nombre == null ? "archivo" : nombre); }
            catch (Exception e) { aviso(getString(R.string.no_descarga)); }
        }

        @JavascriptInterface
        public void tema(String css) {
            Matcher m = Pattern.compile("rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)").matcher(css == null ? "" : css);
            if (!m.find()) return;
            int c = Color.rgb(Integer.parseInt(m.group(1)), Integer.parseInt(m.group(2)), Integer.parseInt(m.group(3)));
            runOnUiThread(() -> { if (c != fondo) { fondo = c; pintarBarras(); } });
        }

        // El temporizador de la página: un aviso a la hora «cuando» (milisegundos desde 1970). Reemplaza el anterior.
        @JavascriptInterface
        public void programarAviso(String id, double cuando, String titulo, String texto, boolean sonido) {
            if (!enLaApp || Double.isNaN(cuando) || cuando <= 0) return;
            AvisoReceptor.programar(getApplicationContext(), corto(id, 300), (long) cuando, corto(titulo, 200), corto(texto, 400), sonido);
            runOnUiThread(MainActivity.this::pedirAvisos);
        }

        @JavascriptInterface
        public void cancelarAviso(String id) {
            if (!enLaApp) return;
            AvisoReceptor.cancelar(getApplicationContext());
        }

        @JavascriptInterface
        public boolean avisosPermitidos() {
            return enLaApp && AvisoReceptor.permitidos(getApplicationContext());
        }

        @JavascriptInterface
        public boolean avisoExacto() {
            return !enLaApp || AvisoReceptor.exacto(getApplicationContext());
        }

        @JavascriptInterface
        public void permitirExacto() {
            if (!enLaApp) return;
            runOnUiThread(MainActivity.this::abrirAjusteExacto);
        }
    }

    static String corto(String t, int n) { if (t == null) return ""; return t.length() > n ? t.substring(0, n) : t; }

    // Android 13+: el permiso de notificaciones se pide la primera vez que empiezas un temporizador (una sola vez; si lo niegas,
    // se activa en Ajustes de Android › Apps › Organización Personal › Notificaciones).
    void pedirAvisos() {
        if (Build.VERSION.SDK_INT < 33 || checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) return;
        SharedPreferences p = getSharedPreferences(AvisoReceptor.PREFS, MODE_PRIVATE);
        if (p.getBoolean("pidio_avisos", false)) return;
        p.edit().putBoolean("pidio_avisos", true).apply();
        requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_AVISOS);
    }

    // Android 12+: el ajuste «Alarmas y recordatorios» de esta app (para el aviso a la hora exacta).
    void abrirAjusteExacto() {
        if (Build.VERSION.SDK_INT < 31) return;
        try {
            startActivity(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + getPackageName())));
        } catch (Exception e) {
            try { startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName()))); }
            catch (Exception e2) { aviso(getString(R.string.sin_app)); }
        }
    }

    // «✓ Hecho», «+5 min» o tocar el aviso: la página lo hace (window.opTempAccion). Solo con la firma de esta app (la llevan los
    // avisos que crea AvisoReceptor), así otra app no puede pedirlo abriendo la actividad.
    void accionDelAviso(Intent i) {
        if (i == null) return;
        String acc = i.getStringExtra(AvisoReceptor.EXTRA_ACC);
        if (acc == null) return;
        String f = i.getStringExtra(AvisoReceptor.EXTRA_FIRMA), id = i.getStringExtra(AvisoReceptor.EXTRA_ID);
        i.removeExtra(AvisoReceptor.EXTRA_ACC);
        if (f == null || !f.equals(AvisoReceptor.firma(this))) return;
        if (!acc.equals("hecho") && !acc.equals("mas5")) acc = "ver";
        NotificationManagerCompat.from(this).cancel(AvisoReceptor.ID_AVISO);
        String js = "(function(){try{return typeof window.opTempAccion==='function'?!!window.opTempAccion(" + JSONObject.quote(acc) + ","
                + JSONObject.quote(corto(id, 300)) + "):null}catch(e){return null}})()";
        if (cargada && web != null) web.evaluateJavascript(js, null); else accionPendiente = js;
    }

    // ---------- Atrás: primero lo que la app sabe cerrar (hojas, diálogos, volver a Inicio); si no queda nada, sale.
    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        if (sinRed.getVisibility() == View.VISIBLE && !web.canGoBack()) { finish(); return; }
        web.evaluateJavascript("(function(){try{return typeof window.opAtras==='function'?!!window.opAtras():null}catch(e){return null}})()", r -> {
            if ("true".equals(r)) return;
            if (!"false".equals(r) && web.canGoBack()) { web.goBack(); return; }
            finish();
        });
    }

    @Override
    protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        setIntent(i);
        accionDelAviso(i);
        Uri u = i.getData();
        if (u != null && esDeLaApp(u)) web.loadUrl(u.toString());
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onResume() {
        super.onResume();
        AvisoReceptor.appVisible = true;   // a la vista, el temporizador suena en la página (la alarma no avisa)
        web.onResume();
    }

    @Override
    protected void onPause() {
        AvisoReceptor.appVisible = false;
        web.onPause();
        CookieManager.getInstance().flush();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            root.removeView(web);
            web.destroy();
        }
        super.onDestroy();
    }
}
