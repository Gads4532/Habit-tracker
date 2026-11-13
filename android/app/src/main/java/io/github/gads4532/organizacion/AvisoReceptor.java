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
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import java.security.SecureRandom;

/**
 * El aviso del temporizador de la app web («▶ Empezar · N min») cuando la app está cerrada o en segundo plano.
 * La página lo programa con OrgAndroid.programarAviso(...) y lo quita con OrgAndroid.cancelarAviso(...).
 * Hay un solo temporizador a la vez: un solo hueco de alarma (programar otra vez reemplaza la anterior).
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
    static final String EXTRA_ACC = "op_temp_acc";
    static final String EXTRA_FIRMA = "op_temp_firma";
    static final String PREFS = "avisos";
    static final long[] VIBRACION = {0, 300, 120, 300, 120, 500};

    // La app está a la vista (MainActivity entre onResume y onPause).
    static volatile boolean appVisible = false;

    // ---------- Programar y quitar
    static void programar(Context c, String id, long cuando, String titulo, String texto, boolean sonido) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        PendingIntent pi = alarmaIntent(c, id, titulo, texto, sonido);
        if (cuando < System.currentTimeMillis()) cuando = System.currentTimeMillis() + 500;
        try {
            if (exacto(c)) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cuando, pi);
            else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cuando, pi);
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cuando, pi);
        }
    }

    static void cancelar(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(alarmaIntent(c, "", "", "", true));
        NotificationManagerCompat.from(c).cancel(ID_AVISO);
    }

    static boolean exacto(Context c) {
        if (Build.VERSION.SDK_INT < 31) return true;
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        return am != null && am.canScheduleExactAlarms();
    }

    static boolean permitidos(Context c) {
        if (Build.VERSION.SDK_INT >= 33 && c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return false;
        return NotificationManagerCompat.from(c).areNotificationsEnabled();
    }

    // Mismo requestCode y la misma acción: reemplaza (FLAG_UPDATE_CURRENT) o encuentra para cancelar la alarma de antes.
    private static PendingIntent alarmaIntent(Context c, String id, String titulo, String texto, boolean sonido) {
        Intent i = new Intent(c, AvisoReceptor.class).setAction("io.github.gads4532.organizacion.TEMPORIZADOR");
        i.putExtra(EXTRA_ID, id).putExtra(EXTRA_TITULO, titulo).putExtra(EXTRA_TEXTO, texto).putExtra(EXTRA_SONIDO, sonido);
        return PendingIntent.getBroadcast(c, REQ_ALARMA, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    // ---------- Al sonar la alarma
    @Override
    public void onReceive(Context c, Intent in) {
        if (appVisible) return;   // a la vista: suena la página
        if (!permitidos(c)) return;
        String id = in.getStringExtra(EXTRA_ID);
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
        if (sonido) b.setDefaults(NotificationCompat.DEFAULT_SOUND).setVibrate(VIBRACION);   // antes de Android 8 (en 8+ lo pone el canal)
        else b.setSilent(true).setVibrate(VIBRACION);
        try { NotificationManagerCompat.from(c).notify(ID_AVISO, b.build()); } catch (SecurityException ignored) { }
    }

    // Tocar el aviso o sus botones abre la app (la actividad ya abierta, si la hay) y le pide la acción a la página.
    // La firma (aleatoria, guardada en la app) evita que otra app pida «Hecho» o «+5 min» abriendo la actividad.
    static PendingIntent abrirIntent(Context c, String acc, String id, int req) {
        Intent i = new Intent(c, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP)
                .putExtra(EXTRA_ACC, acc).putExtra(EXTRA_ID, id == null ? "" : id).putExtra(EXTRA_FIRMA, firma(c));
        return PendingIntent.getActivity(c, REQ_ALARMA + req, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static String firma(Context c) {
        SharedPreferences p = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
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
