import { getData, getClassificationVisible, toggleClassificationVisible } from "./state.js";
import { save } from "./save.js";
import { escapeHTML, safeConfirmDelete, toggleEdit, removeById } from "./utils.js";

export function classifyUK(mark) {
  if (mark >= 70) return "1st Honors";
  if (mark >= 60) return "2:1 Honors";
  if (mark >= 50) return "2:2 Honors";
  if (mark >= 40) return "3rd Honors";
  if (mark === "" || Number.isNaN(mark)) return "—";
  return "Fail";
}

export function moduleTotal(module) {
  const assignments = module.assignments || [];

  const totalWeight = assignments.reduce(
    (sum, a) => sum + Number(a.weight || 0),
    0
  );

  if (!assignments.length || totalWeight < 100) return "";

  const weighted = assignments.reduce((sum, a) => {
    const mark = a.status === "tentative"
      ? 100
      : Number(a.mark || 0);

    return sum + mark * (Number(a.weight || 0) / 100);
  }, 0);

  return weighted.toFixed(1);
}

export function averageOfModuleTotals() {
  const data = getData();
  const totals = data.modules.map(m => moduleTotal(m)).filter(v => v !== "");
  if (!totals.length) return "";
  const average = totals.reduce((sum, value) => sum + Number(value), 0) / totals.length;
  return average.toFixed(1);
}

export function renderModules() {
  const data = getData();

  assignmentModule.innerHTML = data.modules
    .map(m => `<option value="${m.id}">${m.year || "No Year"} — ${m.name} — ${m.term}</option>`)
    .join("");

  const years = ["Year 1", "Year 2", "Year 3"];

  const yearSections = years.map(year => {
    const yearModules = data.modules.filter(m => m.year === year);
    const yearTotals = yearModules
      .map(m => moduleTotal(m))
      .filter(v => v !== "");

    const yearAverage = yearTotals.length
      ? (yearTotals.reduce((sum, value) => sum + Number(value), 0) / yearTotals.length).toFixed(1)
      : "";

    return `
      <details class="year-box">
        <summary>
          <span class="year-arrow"></span>
          <span class="year-title">${year}</span>
          <span class="year-average">
            ${yearAverage
              ? `${yearAverage}% (${classifyUK(Number(yearAverage))})`
              : "No marks yet"}
          </span>
        </summary>

        ${yearModules.length ? yearModules.map(module => {
          const total = moduleTotal(module);
          const totalWeight = (module.assignments || []).reduce((sum, a) => sum + Number(a.weight || 0), 0);

          const hasTentative = (module.assignments || []).some(
            a => a.status === "tentative"
          );

          return `
            <details class="category-card module-toggle" data-id="${module.id}">
              <summary class="module-summary-toggle">
                <div class="item-header">
                  <div>
                    <h3>${module.name}</h3>
                    <div class="module-summary">
                      <span>${module.term}</span>

                      <span>
                        Total: ${total ? `${total}% (${classifyUK(Number(total))})` : "—"}
                      </span>

                      <span>Weight entered: ${totalWeight}%</span>

                      ${
                        hasTentative
                          ? `<span class="tentative-tag">Tentative</span>`
                          : ""
                      }
                    </div>
                  </div>

                  <div class="action-row">
                    <button class="soft-btn" onclick="toggleEdit('edit-module-${module.id}')">Edit</button>
                    <button class="delete" onclick="removeById('modules','${module.id}')">Delete</button>
                  </div>
                </div>
              </summary>

              <div id="edit-module-${module.id}" class="edit-panel">
                <input id="module-name-${module.id}" value="${escapeHTML(module.name)}">
                <select id="module-term-${module.id}">
                  ${["Term 1", "Term 2", "Term 3"].map(option =>
                    `<option ${option === module.term ? "selected" : ""}>${option}</option>`
                  ).join("")}
                </select>
                <select id="module-year-${module.id}">
                  ${["Year 1", "Year 2", "Year 3"].map(option =>
                    `<option ${option === module.year ? "selected" : ""}>${option}</option>`
                  ).join("")}
                </select>
                <button onclick="updateModule('${module.id}')">Save Module</button>
              </div>

              <div class="assignment-list">
                ${(module.assignments || []).map(a => `
                  <div class="assignment-card">
                    <div class="item-header">
                      <div>
                        <strong>${a.name}</strong>
                        <p>
                          ${a.status === "tentative"
                            ? "Tentative / Not graded yet"
                            : `${a.mark}% (${classifyUK(Number(a.mark))})`}
                          · Weighting: ${a.weight}%
                          ${a.date ? ` · ${a.date}` : ""}
                        </p>
                      </div>

                      <div class="action-row">
                        <button class="soft-btn" onclick="toggleEdit('edit-assignment-${a.id}')">Edit</button>
                        <button class="delete" onclick="deleteAssignment('${module.id}', '${a.id}')">Delete</button>
                      </div>
                    </div>

                    <div id="edit-assignment-${a.id}" class="edit-panel">
                      <input id="assignment-name-${a.id}" value="${escapeHTML(a.name)}">
                      <input id="assignment-mark-${a.id}" type="number" min="0" max="100" step="0.1" value="${a.mark}">
                      <input id="assignment-weight-${a.id}" type="number" min="0" max="100" step="0.1" value="${a.weight}">
                      <input id="assignment-date-${a.id}" type="date" value="${a.date || ""}">

                      <select id="assignment-status-${a.id}">
                        <option value="graded" ${a.status !== "tentative" ? "selected" : ""}>Graded</option>
                        <option value="tentative" ${a.status === "tentative" ? "selected" : ""}>Tentative / Not graded yet</option>
                      </select>

                      <button onclick="updateAssignment('${module.id}', '${a.id}')">Save Assignment</button>
                    </div>
                  </div>
                `).join("") || "<p>No assignments yet.</p>"}
              </div>
            </details>
          `;
        }).join("") : "<p>No modules yet.</p>"}
      </details>
    `;
  }).join("");

  const openYears = [...document.querySelectorAll(".year-box")]
    .map((el, i) => el.open ? i : -1)
    .filter(i => i !== -1);

  const openModules = [...document.querySelectorAll(".module-toggle")]
    .filter(el => el.open)
    .map(el => el.dataset.id)
    .filter(Boolean);

  moduleList.innerHTML = yearSections;

  document.querySelectorAll(".year-box").forEach((el, i) => {
    if (openYears.includes(i)) {
      el.open = true;
    }
  });

  document.querySelectorAll(".module-toggle").forEach(el => {
    if (openModules.includes(el.dataset.id)) {
      el.open = true;
    }
  });

  const average = averageOfModuleTotals();
  moduleAverageDisplay.textContent = average ? `${average}%` : "—";
  classificationDisplay.textContent = average
    ? classifyUK(Number(average))
    : "—";
}

export function updateModule(id) {
  const data = getData();
  const module = data.modules.find(m => m.id === id);
  module.name = document.getElementById(`module-name-${id}`).value;
  module.term = document.getElementById(`module-term-${id}`).value;
  module.year = document.getElementById(`module-year-${id}`).value;
  save();
}

export function updateAssignment(moduleId, assignmentId) {
  const data = getData();
  const module = data.modules.find(m => m.id === moduleId);
  const assignment = module.assignments.find(a => a.id === assignmentId);
  assignment.name = document.getElementById(`assignment-name-${assignmentId}`).value;
  assignment.mark = assignment.status === "tentative"
    ? ""
    : Number(document.getElementById(`assignment-mark-${assignmentId}`).value);
  assignment.weight = Number(document.getElementById(`assignment-weight-${assignmentId}`).value);
  assignment.date = document.getElementById(`assignment-date-${assignmentId}`).value;
  assignment.status = document.getElementById(`assignment-status-${assignmentId}`).value;
  save();
}

export function deleteAssignment(moduleId, assignmentId) {
  const data = getData();
  if (!safeConfirmDelete()) return;
  const module = data.modules.find(m => m.id === moduleId);
  module.assignments = module.assignments.filter(a => a.id !== assignmentId);
  save();
}

document.getElementById("toggleClassification")?.addEventListener("click", () => {
  const visible = toggleClassificationVisible();

  const moduleAverage = averageOfModuleTotals();
  const classification = moduleAverage ? classifyUK(Number(moduleAverage)) : "—";

  document.getElementById("dashClassification").textContent =
    visible ? classification : "";

  document.getElementById("toggleClassification").textContent =
    visible ? "Hide" : "Show";
});

