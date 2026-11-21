package io.github.gads4532.organizacion;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * El aviso del temporizador de la app web («▶ Empezar · N min») cuando la app está cerrada o en segundo plano.
 * La página lo programa con OrgAndroid.programarAviso(...) y lo quita con OrgAndroid.cancelarAviso(...).
 * Una alarma por clave (la del temporizador o la de cada paso de una cadena): programar la misma clave la reemplaza (+5 min, «Que queden»)
 * y las de claves distintas conviven, así el paso que acaba de terminar no pierde su aviso cuando empieza el siguiente.
 * Al publicar un aviso lo anota (clave y hora): la página pregunta con avisoDado() y no vuelve a sonar al abrirla.
 * AlarmManager: setExactAndAllowWhileIdle si Android deja alarmas exactas; si no, setAndAllowWhileIdle (puede llegar unos minutos tarde).
 * Al sonar, si la app está a la vista no hace nada (la página ya suena y muestra «Se cumplió el tiempo»).
 */
public class AvisoReceptor extends BroadcastReceiver {

    static final String CANAL = "temporizador";
    static final String CANAL_SILENCIO = "temporizador_silencio";
    static final int ID_AVISO = 2190;
    static final int REQ_ALARMA = 2191;
    static final String EXTRA_ID = "op_temp_id";
    static final String EXTRA_TITULO = "op_temp_titulo";
    static final String EXTRA_TEXTO = "op_temp_texto";
    static final String EXTRA_SONIDO = "op_temp_sonido";
    static final String EXTRA_CUANDO = "op_temp_cuando";
    static final String EXTRA_ACC = "op_temp_acc";
    static final String EXTRA_FIRMA = "op_temp_firma";
    static final String PREFS = "avisos";
    static final long[] VIBRACION = {0, 300, 120, 300, 120, 500};
    static final String K_ACTIVAS = "activas";   // claves con alarma pendiente
    static final String K_DADOS = "dados";       // «hora\nclave» de los avisos ya publicados (los últimos 12)
    static final int MAX_ACTIVAS = 80;

    // La app está a la vista (MainActivity entre onResume y onPause).
    static volatile boolean appVisible = false;

    // ---------- Programar y quitar
    static synchronized void programar(Context c, String id, long cuando, String titulo, String texto, boolean sonido) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        SharedPreferences p = prefs(c);
        Set<String> act = new HashSet<>(p.getStringSet(K_ACTIVAS, new HashSet<>()));
        if (!act.contains(id) && act.size() >= MAX_ACTIVAS) return;
        long pedido = cuando;   // la hora de la página (la clave de avisoDado), aunque la alarma se adelante a «ya»
        if (cuando < System.currentTimeMillis()) cuando = System.currentTimeMillis() + 500;
        PendingIntent pi = alarmaIntent(c, id, pedido, titulo, texto, sonido);
        try {
            if (exacto(c)) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cuando, pi);
            else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cuando, pi);
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cuando, pi);
        }
        act.add(id);
        p.edit().putStringSet(K_ACTIVAS, act).apply();
    }

    // id vacío: todas las alarmas pendientes y sus avisos.
    static synchronized void cancelar(Context c, String id) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        SharedPreferences p = prefs(c);
        Set<String> act = new HashSet<>(p.getStringSet(K_ACTIVAS, new HashSet<>()));
        List<String> ids = new ArrayList<>();
        if (id == null || id.isEmpty()) ids.addAll(act); else ids.add(id);
        NotificationManagerCompat nm = NotificationManagerCompat.from(c);
        for (String k : ids) {
            if (am != null) am.cancel(alarmaIntent(c, k, 0, "", "", true));
            nm.cancel(k, ID_AVISO);
            act.remove(k);
        }
        if (id == null || id.isEmpty()) { act.clear(); nm.cancel(ID_AVISO); }
        p.edit().putStringSet(K_ACTIVAS, act).apply();
    }

    // ¿Ya salió el aviso de esta clave para esta hora? (margen de 2 s por el redondeo)
    static boolean dado(Context c, String id, long cuando) {
        for (String x : prefs(c).getStringSet(K_DADOS, new HashSet<>())) {
            int i = x.indexOf('\n');
            if (i <= 0 || !x.substring(i + 1).equals(id)) continue;
            try { if (Math.abs(Long.parseLong(x.substring(0, i)) - cuando) <= 2000) return true; } catch (NumberFormatException ignored) { }
        }
        return false;
    }

    private static synchronized void anotarDado(Context c, String id, long cuando) {
        SharedPreferences p = prefs(c);
        List<String> l = new ArrayList<>(p.getStringSet(K_DADOS, new HashSet<>()));
        l.add(cuando + "\n" + id);
        Collections.sort(l, (a, b) -> Long.compare(hora(b), hora(a)));
        Set<String> act = new HashSet<>(p.getStringSet(K_ACTIVAS, new HashSet<>()));
        act.remove(id);
        p.edit().putStringSet(K_DADOS, new HashSet<>(l.subList(0, Math.min(12, l.size())))).putStringSet(K_ACTIVAS, act).apply();
    }

    private static synchronized void quitarActiva(Context c, String id) {
        Set<String> act = new HashSet<>(prefs(c).getStringSet(K_ACTIVAS, new HashSet<>()));
        if (act.remove(id)) prefs(c).edit().putStringSet(K_ACTIVAS, act).apply();
    }

    private static long hora(String x) {
        int i = x.indexOf('\n');
        try { return i > 0 ? Long.parseLong(x.substring(0, i)) : 0; } catch (NumberFormatException e) { return 0; }
    }

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    static boolean exacto(Context c) {
        if (Build.VERSION.SDK_INT < 31) return true;
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        return am != null && am.canScheduleExactAlarms();
    }

    static boolean permitidos(Context c) {
        if (Build.VERSION.SDK_INT >= 33 && c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return false;
        return NotificationManagerCompat.from(c).areNotificationsEnabled();
    }

    // La clave va en el data del Intent: la misma clave reemplaza (FLAG_UPDATE_CURRENT) o encuentra para cancelar su alarma; otra clave es otra alarma.
    private static PendingIntent alarmaIntent(Context c, String id, long cuando, String titulo, String texto, boolean sonido) {
        Intent i = new Intent(c, AvisoReceptor.class).setAction("io.github.gads4532.organizacion.TEMPORIZADOR")
                .setData(new Uri.Builder().scheme("optemp").authority("alarma").appendPath(id).build());
        i.putExtra(EXTRA_ID, id).putExtra(EXTRA_CUANDO, cuando).putExtra(EXTRA_TITULO, titulo).putExtra(EXTRA_TEXTO, texto).putExtra(EXTRA_SONIDO, sonido);
        return PendingIntent.getBroadcast(c, REQ_ALARMA, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    // ---------- Al sonar la alarma
    @Override
    public void onReceive(Context c, Intent in) {
        String id = in.getStringExtra(EXTRA_ID);
        if (id == null) id = "";
        long cuando = in.getLongExtra(EXTRA_CUANDO, 0);
        if (appVisible || !permitidos(c)) { quitarActiva(c, id); return; }   // a la vista suena la página; sin permiso no sale nada (la página suena al volver)
        String titulo = in.getStringExtra(EXTRA_TITULO);
        String texto = in.getStringExtra(EXTRA_TEXTO);
        boolean sonido = in.getBooleanExtra(EXTRA_SONIDO, true);
        canales(c);
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, sonido ? CANAL : CANAL_SILENCIO)
                .setSmallIcon(R.drawable.ic_aviso)
                .setContentTitle(titulo == null || titulo.isEmpty() ? c.getString(R.string.aviso_titulo) : titulo)
                .setContentText(texto == null ? "" : texto)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(texto == null ? "" : texto))
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setContentIntent(abrirIntent(c, "ver", id, 1))
                .addAction(0, c.getString(R.string.aviso_hecho), abrirIntent(c, "hecho", id, 2))
                .addAction(0, c.getString(R.string.aviso_mas5), abrirIntent(c, "mas5", id, 3));
        // Antes de Android 8 (en 8+ lo pone el canal). Sin sonido: solo vibra. Nunca setSilent(true): también quitaría la vibración y el aviso emergente.
        if (sonido) b.setDefaults(NotificationCompat.DEFAULT_SOUND).setVibrate(VIBRACION);
        else b.setSound((Uri) null).setVibrate(VIBRACION);
        try {
            NotificationManagerCompat.from(c).notify(id, ID_AVISO, b.build());
            anotarDado(c, id, cuando);
        } catch (SecurityException ignored) { }
    }

    // Tocar el aviso o sus botones abre la app (la actividad ya abierta, si la hay) y le pide la acción a la página.
    // La firma (aleatoria, guardada en la app) evita que otra app pida «Hecho» o «+5 min» abriendo la actividad.
    static PendingIntent abrirIntent(Context c, String acc, String id, int req) {
        Intent i = new Intent(c, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP)
                .setData(new Uri.Builder().scheme("optemp").authority(acc).appendPath(id == null ? "" : id).build())   // un PendingIntent por aviso y botón
                .putExtra(EXTRA_ACC, acc).putExtra(EXTRA_ID, id == null ? "" : id).putExtra(EXTRA_FIRMA, firma(c));
        return PendingIntent.getActivity(c, REQ_ALARMA + req, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static String firma(Context c) {
        SharedPreferences p = prefs(c);
        String f = p.getString("firma", null);
        if (f == null) {
            byte[] b = new byte[16];
            new SecureRandom().nextBytes(b);
            StringBuilder sb = new StringBuilder();
            for (byte x : b) sb.append(String.format("%02x", x));
            f = sb.toString();
            p.edit().putString("firma", f).apply();
        }
        return f;
    }

    static void canales(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;
        NotificationChannel a = new NotificationChannel(CANAL, c.getString(R.string.canal_temporizador), NotificationManager.IMPORTANCE_HIGH);
        a.setDescription(c.getString(R.string.canal_temporizador_desc));
        a.enableVibration(true);
        a.setVibrationPattern(VIBRACION);
        nm.createNotificationChannel(a);
        NotificationChannel s = new NotificationChannel(CANAL_SILENCIO, c.getString(R.string.canal_silencio), NotificationManager.IMPORTANCE_HIGH);
        s.setDescription(c.getString(R.string.canal_silencio_desc));
        s.setSound(null, null);
        s.enableVibration(true);
        s.setVibrationPattern(VIBRACION);
        nm.createNotificationChannel(s);
    }
}
