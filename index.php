<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="theme-color" content="#120810">
  <title>Mi Calendario de Amor 💖</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&family=Dancing+Script:wght@500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

  <!-- Particles -->
  <div class="particles" id="particles"></div>

  <!-- App Shell -->
  <div class="app">

    <!-- Header -->
    <header class="app-header">
      <div class="header-inner">
        <div class="header-title">
          <span class="header-script">Mi Calendario</span>
          <span class="header-heart">💖</span>
        </div>
        <button class="btn-add-event" id="btnAddEvent" title="Agregar evento">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="app-main">

      <!-- Calendar Card -->
      <section class="calendar-card">
        <!-- Month Navigation -->
        <div class="month-nav">
          <button class="nav-btn" id="prevMonth">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div class="month-title-wrap">
            <h2 class="month-name" id="monthName"></h2>
            <span class="year-badge" id="yearBadge"></span>
          </div>
          <button class="nav-btn" id="nextMonth">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <!-- Weekday headers -->
        <div class="weekdays">
          <span>Dom</span><span>Lun</span><span>Mar</span><span>Mié</span>
          <span>Jue</span><span>Vie</span><span>Sáb</span>
        </div>

        <!-- Days Grid -->
        <div class="days-grid" id="daysGrid"></div>
      </section>

      <!-- Today's Events Strip -->
      <section class="today-strip" id="todayStrip">
        <div class="strip-header">
          <span class="strip-title">Hoy</span>
          <span class="strip-date" id="stripDate"></span>
        </div>
        <div class="strip-events" id="stripEvents">
          <div class="empty-day">
            <span>✨</span>
            <p>Sin eventos hoy</p>
          </div>
        </div>
      </section>

      <!-- Love Notes -->
      <section class="notes-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">💌</span>
            Notas de Amor
          </h3>
          <button class="btn-add-note" id="btnAddNote">Agregar nota</button>
        </div>
        <div class="notes-grid" id="notesGrid">
          <div class="notes-empty">
            <span>🌹</span>
            <p>Escribe tu primera nota de amor</p>
          </div>
        </div>
      </section>

    </main>

    <!-- Bottom Nav -->
    <nav class="bottom-nav">
      <button class="nav-item active" data-tab="calendar">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span>Calendario</span>
      </button>
      <button class="nav-item" data-tab="notes">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <span>Amor</span>
      </button>
    </nav>
  </div>

  <!-- ── ADD EVENT MODAL ──────────────────────────────────── -->
  <div class="modal-overlay" id="eventModal">
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title" id="eventModalTitle">Nuevo Evento ✨</h3>
        <button class="modal-close" id="closeEventModal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <form class="modal-form" id="eventForm">
        <input type="hidden" id="eventId">

        <div class="form-group">
          <label class="form-label">Título</label>
          <input type="text" class="form-input" id="eventTitle" placeholder="¿Qué celebramos? 💖" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Fecha</label>
            <input type="date" class="form-input" id="eventDate" required>
          </div>
          <div class="form-group">
            <label class="form-label">Hora (opcional)</label>
            <input type="time" class="form-input" id="eventTime">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Categoría</label>
          <div class="category-grid" id="categoryGrid">
            <button type="button" class="cat-btn active" data-cat="love" data-emoji="❤️" data-color="#e94d7f">❤️ Amor</button>
            <button type="button" class="cat-btn" data-cat="anniversary" data-emoji="💑" data-color="#c41e8f">💑 Aniversario</button>
            <button type="button" class="cat-btn" data-cat="birthday" data-emoji="🎂" data-color="#f7a52b">🎂 Cumpleaños</button>
            <button type="button" class="cat-btn" data-cat="date" data-emoji="🌹" data-color="#b5373c">🌹 Cita</button>
            <button type="button" class="cat-btn" data-cat="special" data-emoji="⭐" data-color="#9b59b6">⭐ Especial</button>
            <button type="button" class="cat-btn" data-cat="important" data-emoji="📌" data-color="#2980b9">📌 Importante</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Descripción (opcional)</label>
          <textarea class="form-input form-textarea" id="eventDesc" placeholder="Escribe algo bonito... 🌸" rows="3"></textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" id="deleteEventBtn" style="display:none">Eliminar</button>
          <div class="form-actions-right">
            <button type="button" class="btn-ghost" id="cancelEventBtn">Cancelar</button>
            <button type="submit" class="btn-primary">
              <span id="eventSubmitLabel">Guardar</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- ── DAY DETAIL MODAL ─────────────────────────────────── -->
  <div class="modal-overlay" id="dayModal">
    <div class="modal modal-day">
      <div class="modal-header">
        <h3 class="modal-title" id="dayModalTitle"></h3>
        <button class="modal-close" id="closeDayModal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="day-events-list" id="dayEventsList"></div>
      <button class="btn-add-in-day" id="btnAddInDay">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Agregar evento en este día
      </button>
    </div>
  </div>

  <!-- ── ADD NOTE MODAL ───────────────────────────────────── -->
  <div class="modal-overlay" id="noteModal">
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">Nueva Nota 💌</h3>
        <button class="modal-close" id="closeNoteModal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <form class="modal-form" id="noteForm">
        <div class="form-group">
          <label class="form-label">Título</label>
          <input type="text" class="form-input" id="noteTitle" placeholder="Un pensamiento hermoso..." required>
        </div>
        <div class="form-group">
          <label class="form-label">Nota</label>
          <textarea class="form-input form-textarea" id="noteContent" placeholder="Escribe lo que sientes... 🌹" rows="5"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Estado de ánimo</label>
          <div class="mood-grid">
            <button type="button" class="mood-btn active" data-mood="happy">😊 Feliz</button>
            <button type="button" class="mood-btn" data-mood="love">🥰 Enamorado</button>
            <button type="button" class="mood-btn" data-mood="excited">🎉 Emocionado</button>
            <button type="button" class="mood-btn" data-mood="nostalgic">🌙 Nostálgico</button>
          </div>
        </div>
        <div class="form-actions">
          <div class="form-actions-right">
            <button type="button" class="btn-ghost" id="cancelNoteBtn">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar nota</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <script src="assets/js/app.js"></script>
</body>
</html>
