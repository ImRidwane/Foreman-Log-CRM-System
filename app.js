(function () {
  "use strict";

  var STORAGE_KEY = "fieldwork_friend_logbook_v1";
  var TYPES = {
    material: "Materials used",
    "near-miss": "Near miss",
    "field-note": "Field note"
  };
  var state = loadState();
  var toastTimer;
  var $ = function (selector, root) { return (root || document).querySelector(selector); };

  function today() {
    var date = new Date();
    return date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" +
      ("0" + date.getDate()).slice(-2);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function validEntry(entry) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) ||
        typeof entry.id !== "string" || typeof entry.type !== "string" || !TYPES[entry.type] ||
        typeof entry.date !== "string" || typeof entry.title !== "string" ||
        typeof entry.details !== "string") return false;
    if (entry.site != null && typeof entry.site !== "string") return false;
    if (entry.type === "material") {
      return typeof entry.item === "string" && typeof entry.unit === "string" &&
        typeof entry.quantity === "number" && Number.isFinite(entry.quantity) && entry.quantity > 0;
    }
    if (entry.type === "near-miss") {
      return ["Low", "Medium", "High"].indexOf(entry.severity) !== -1;
    }
    return true;
  }

  function loadState() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return { entries: [] };
      var parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.entries) && parsed.entries.every(validEntry)) return parsed;
      console.error("The saved field log has an invalid structure.");
    } catch (error) {
      console.error("Could not read the saved field log.", error);
    }
    return { entries: [] };
  }

  function showToast(message) {
    var toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2600);
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      console.error("Could not save the field log.", error);
      showToast("Could not save. Check this browser’s storage settings.");
      return false;
    }
  }

  function updateTypeFields() {
    var type = $("#entry-type").value;
    var titleLabel = $("#title-label");
    var detailsLabel = $("#details-label");
    var details = $('#entry-form [name="details"]');
    if (type === "material") {
      titleLabel.textContent = "Item used";
      detailsLabel.textContent = "Where and how it was used";
      details.placeholder = "Add any useful context";
      $("#type-fields").innerHTML =
        '<div class="field-grid">' +
        '<label class="field">Quantity<input name="quantity" type="number" min="0.01" step="any" required placeholder="e.g. 4"></label>' +
        '<label class="field">Unit<input name="unit" type="text" maxlength="40" required placeholder="e.g. sheets, boxes, ft"></label>' +
        "</div>";
    } else if (type === "near-miss") {
      titleLabel.textContent = "Near-miss summary";
      detailsLabel.textContent = "What happened and immediate action";
      details.placeholder = "Record the facts and any action taken. Use your required safety-reporting process too.";
      $("#type-fields").innerHTML =
        '<label class="field">Severity<select name="severity" required><option>Low</option><option>Medium</option><option>High</option></select></label>';
    } else {
      titleLabel.textContent = "Headline";
      detailsLabel.textContent = "Field note";
      details.placeholder = "What should the next person know?";
      $("#type-fields").innerHTML = "";
    }
  }

  function formatDate(value) {
    var date = new Date(value + "T12:00:00");
    return isNaN(date.getTime()) ? "Date not set" :
      date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function render() {
    var filter = $("#entry-filter").value;
    var query = $("#entry-search").value.trim().toLowerCase();
    var entries = state.entries.filter(function (entry) {
      if (filter !== "all" && entry.type !== filter) return false;
      return [entry.title, entry.site, entry.details, entry.item, entry.unit, entry.severity]
        .join(" ").toLowerCase().indexOf(query) !== -1;
    }).sort(function (a, b) { return b.date.localeCompare(a.date); });

    $("#entries-list").innerHTML = entries.map(function (entry) {
      var extra = "";
      if (entry.type === "material") {
        extra = '<p class="entry-extra">Used: ' + escapeHtml(entry.quantity) + " " + escapeHtml(entry.unit) + "</p>";
      } else if (entry.type === "near-miss") {
        extra = '<span class="severity-badge ' + escapeHtml(entry.severity.toLowerCase()) + '">' +
          escapeHtml(entry.severity) + " severity</span>";
      }
      return '<article class="entry-card"><div><div class="entry-title-row"><h3 class="entry-title">' +
        escapeHtml(entry.title) + '</h3><span class="type-badge ' + escapeHtml(entry.type) + '">' +
        escapeHtml(TYPES[entry.type]) + '</span></div><p class="entry-meta">' + escapeHtml(formatDate(entry.date)) +
        (entry.site ? " · " + escapeHtml(entry.site) : "") + "</p>" + extra +
        '<p class="entry-details">' + escapeHtml(entry.details) + '</p></div><button class="delete-button" type="button" data-delete="' +
        escapeHtml(entry.id) + '" aria-label="Delete ' + escapeHtml(entry.title) + '">×</button></article>';
    }).join("");
    $("#empty-state").hidden = entries.length > 0;
    $("#filtered-count").textContent = entries.length + (entries.length === 1 ? " entry" : " entries");
    $("#entry-count").textContent = state.entries.length;
    $("#material-count").textContent = state.entries.filter(function (entry) { return entry.type === "material"; }).length;
    $("#near-miss-count").textContent = state.entries.filter(function (entry) { return entry.type === "near-miss"; }).length;
  }

  function csvCell(value) {
    var text = String(value == null ? "" : value);
    if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function download(name, content, mime) {
    try {
      var url = URL.createObjectURL(new Blob([content], { type: mime }));
      var link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      showToast("Download started");
    } catch (error) {
      console.error("Could not create the download.", error);
      showToast("Could not download the file.");
    }
  }

  function exportBackup() {
    download("fieldwork-logbook-backup-" + today() + ".json", JSON.stringify(state, null, 2), "application/json");
  }

  function exportCsv() {
    var rows = [["Type", "Date", "Job or site", "Title", "Quantity", "Unit", "Severity", "Details"]];
    state.entries.forEach(function (entry) {
      rows.push([TYPES[entry.type], entry.date, entry.site, entry.title, entry.quantity, entry.unit, entry.severity, entry.details]);
    });
    download("fieldwork-logbook-" + today() + ".csv",
      "\ufeff" + rows.map(function (row) { return row.map(csvCell).join(","); }).join("\r\n"),
      "text/csv;charset=utf-8");
  }

  function importBackup(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var imported = JSON.parse(reader.result);
        if (!imported || !Array.isArray(imported.entries) || !imported.entries.every(validEntry)) {
          throw new Error("The backup has an invalid structure.");
        }
        if (!window.confirm("Import this backup and replace the entries on this device?")) return;
        state = { entries: imported.entries };
        if (saveState()) {
          render();
          showToast("Backup restored");
        }
      } catch (error) {
        console.error("Could not restore the field log.", error);
        showToast("That file isn’t a valid field log backup.");
      } finally {
        $("#backup-file").value = "";
      }
    };
    reader.onerror = function () {
      showToast("Could not read that file.");
      $("#backup-file").value = "";
    };
    reader.readAsText(file);
  }

  $("#entry-date").value = today();
  updateTypeFields();
  $("#entry-type").addEventListener("change", updateTypeFields);
  $("#entry-filter").addEventListener("change", render);
  $("#entry-search").addEventListener("input", render);
  $("#export-backup").addEventListener("click", exportBackup);
  $("#export-csv").addEventListener("click", exportCsv);
  $("#import-backup").addEventListener("click", function () { $("#backup-file").click(); });
  $("#backup-file").addEventListener("change", function () { importBackup(this.files[0]); });
  $("#entry-form").addEventListener("submit", function (event) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    var data = new FormData(event.currentTarget);
    var type = data.get("type");
    var entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      type: type,
      date: data.get("date"),
      site: data.get("site").trim(),
      title: data.get("title").trim(),
      details: data.get("details").trim()
    };
    if (type === "material") {
      entry.item = entry.title;
      entry.quantity = Number(data.get("quantity"));
      entry.unit = data.get("unit").trim();
    } else if (type === "near-miss") {
      entry.severity = data.get("severity");
    }
    if (!validEntry(entry)) {
      showToast("Check the entry details and try again.");
      return;
    }
    state.entries.unshift(entry);
    var saved = saveState();
    event.currentTarget.reset();
    $("#entry-date").value = today();
    updateTypeFields();
    render();
    if (saved) showToast("Entry saved on this device");
  });
  $("#entries-list").addEventListener("click", function (event) {
    var button = event.target.closest("[data-delete]");
    if (!button) return;
    var entry = state.entries.find(function (item) { return item.id === button.dataset.delete; });
    if (!entry || !window.confirm("Delete this field log entry?")) return;
    state.entries = state.entries.filter(function (item) { return item.id !== entry.id; });
    var saved = saveState();
    render();
    if (saved) showToast("Entry deleted");
  });
  render();
})();
