/*
  =============================
  Lógica del Diario de Viajes
  =============================
  - CRUD de viajes con jQuery
  - Persistencia local con localStorage
  - Manejo de DOM y eventos
*/

$(document).ready(function() {

  // Clave de almacenamiento local
  const STORAGE_KEY = "diario_viajes_v1";

  // Función para generar un ID único
  function uid() {
    return 'id-' + Math.random().toString(36).substr(2, 9);
  }

  // Convertir un link de YouTube en URL embebible
  function toYoutubeEmbed(url) {
    if (!url) return "";

    try {
      const u = new URL(url);

      // youtube.com/watch?v=...
      if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
        return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
      }

      // youtu.be/xxxxx
      if (u.hostname.includes('youtu.be')) {
        return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
      }

      // fallback: dejamos lo que venga
      return url;
    } catch (e) {
      return url;
    }
  }

  // Cargar los viajes desde localStorage
  function loadTrips() {
    const data = localStorage.getItem(STORAGE_KEY);
    try {
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error parseando localStorage", e);
      return [];
    }
  }

  // Guardar viajes en localStorage
  function saveTrips(trips) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  }

  // Renderizar los viajes en pantalla
  function renderTrips() {
    const trips = loadTrips().sort((a, b) => {
      const aDate = a.createdAt || "";
      const bDate = b.createdAt || "";
      return bDate.localeCompare(aDate); // más nuevos primero
    });

    const $list = $("#trips-list").empty();

    if (trips.length === 0) {
      $list.append("<p class='muted'>Aún no has agregado ningún viaje ✈️</p>");
      return;
    }

    trips.forEach(trip => {
      const embed = trip.video ? toYoutubeEmbed(trip.video) : "";

      const $card = $(`
        <article data-id="${trip.id}">
          <h3>${trip.title}</h3>
          <p><strong>Destino:</strong> ${trip.location || "No especificado"}</p>
          <p><strong>Fecha:</strong> ${trip.date || "Sin fecha"}</p>
          <p>${trip.notes || ""}</p>
          ${embed ? `<iframe src="${embed}" allowfullscreen></iframe>` : ""}
          <div class="actions">
            <button class="edit primary">Editar</button>
            <button class="delete ghost">Eliminar</button>
          </div>
        </article>
      `);

      $card.find(".edit").click(() => populateForm(trip.id));
      $card.find(".delete").click(() => removeTrip(trip.id));
      $list.append($card);
    });
  }

  // Agregar o actualizar viaje
  $("#trip-form").on("submit", function(e) {
    e.preventDefault();

    const id = $("#trip-id").val();
    const title = $("#trip-title").val().trim();
    const location = $("#trip-location").val().trim();
    const date = $("#trip-date").val();
    const video = $("#trip-video").val().trim();
    const notes = $("#trip-notes").val().trim();

    if (!title) {
      alert("El título es obligatorio");
      return;
    }

    let trips = loadTrips();

    if (id) {
      // Editar viaje existente
      const i = trips.findIndex(t => t.id === id);
      if (i >= 0) {
        trips[i] = { 
          ...trips[i],
          title,
          location,
          date,
          video,
          notes
        };
      }
      $("#form-status").text("Viaje actualizado.");
    } else {
      // Crear nuevo viaje
      const newTrip = {
        id: uid(),
        title,
        location,
        date,
        video,
        notes,
        createdAt: new Date().toISOString()
      };
      trips.push(newTrip);
      $("#form-status").text("Viaje guardado.");
    }

    saveTrips(trips);
    renderTrips();
    clearForm();
  });

  // Eliminar viaje
  function removeTrip(id) {
    if (!confirm("¿Eliminar este viaje?")) return;
    const trips = loadTrips().filter(t => t.id !== id);
    saveTrips(trips);
    renderTrips();
  }

  // Cargar datos en el formulario para editar
  function populateForm(id) {
    const trip = loadTrips().find(t => t.id === id);
    if (!trip) return;

    $("#trip-id").val(trip.id);
    $("#trip-title").val(trip.title);
    $("#trip-location").val(trip.location);
    $("#trip-date").val(trip.date);
    $("#trip-video").val(trip.video);
    $("#trip-notes").val(trip.notes);
    $("#form-status").text("Editando viaje...");

    // Bajamos suave hasta el formulario (útil en mobile)
    $("html,body").animate({
      scrollTop: $("#view-form").offset().top
    }, 300);
  }

  // Limpiar el formulario
  function clearForm() {
    $("#trip-form")[0].reset();
    $("#trip-id").val("");
    $("#form-status").text("");
  }

  $("#btn-clear").click(clearForm);

  // Borrar todos los datos
  $("#btn-reset").click(() => {
    if (confirm("¿Borrar todos los viajes guardados?")) {
      localStorage.removeItem(STORAGE_KEY);
      renderTrips();
    }
  });

  // Navegación rápida
  $("#nav-list").click(() =>
    $("html,body").animate(
      { scrollTop: $("#view-list").offset().top },
      300
    )
  );

  $("#nav-new").click(() =>
    $("html,body").animate(
      { scrollTop: $("#view-form").offset().top },
      300
    )
  );

    // Botones del HERO (IDs distintos, sin duplicar)
  $("#hero-nav-list").click(() =>
    $("html,body").animate(
      { scrollTop: $("#view-list").offset().top },
      300
    )
  );

  $("#hero-nav-new").click(() =>
    $("html,body").animate(
      { scrollTop: $("#view-form").offset().top },
      300
    )
  );

  // Botón grande del hero
  $("#scroll-main").click(() =>
    $("html,body").animate(
      { scrollTop: $("#view-list").offset().top - 10 },
      400
    )
  );

  // Modal de información
  $("#btn-info").click(() => $("#overlay").css("display", "flex"));

  $("#modal-close, #overlay").click(e => {
    if (e.target.id === "overlay" || e.target.id === "modal-close") {
      $("#overlay").hide();
    }
  });

  // Cargar datos iniciales (incluyendo un ejemplo si está vacío)
  let trips = loadTrips();

  if (trips.length === 0) {
    const demo = {
      id: uid(),
      title: "Primer viaje de ejemplo",
      location: "Mendoza, Argentina",
      date: "2024-02-14",
      video: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
      notes: "Un viaje increíble por la cordillera. Disfruté el vino y la montaña.",
      createdAt: new Date().toISOString()
    };
    trips = [demo];
    saveTrips(trips);
  }

  renderTrips();
});

