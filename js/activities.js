import { save } from "./save.js";
import { getData } from "./state.js";
import { totalHours, escapeHTML, safeConfirmDelete, toggleEdit } from "./utils.js";
import { ringHTML } from "./dashboard.js";

export function renderActivities() {
  const data = getData();

  activityCategory.innerHTML = data.categories
    .map(c => `<option value="${c.id}">${c.name}</option>`)
    .join("");

  activityList.innerHTML = data.categories.map(c => {
    const done = totalHours(c);
    const hasHourGoal = Number(c.goal || 0) > 0;

    return `
      <div class="category-card">
        <div class="item-header">
          <div>
            <h3>${c.name}</h3>
            ${hasHourGoal
              ? `<p>${done} / ${c.goal} hours completed</p>`
              : `<p>${(c.activities || []).length} experience(s) added</p>`
            }
          </div>

          <div class="action-row">
            <button class="soft-btn" onclick="toggleEdit('edit-category-${c.id}')">Edit Goal</button>
            <button class="delete" onclick="deleteCategory('${c.id}')">Delete</button>
          </div>
        </div>

        <div id="edit-category-${c.id}" class="edit-panel">
          <input id="category-name-${c.id}" value="${escapeHTML(c.name)}">
          <input id="category-goal-${c.id}" type="number" min="0" step="1" value="${c.goal || 0}">
          <button onclick="updateCategory('${c.id}')">Save Category</button>
        </div>

        ${hasHourGoal ? ringHTML(c.name, done, c.goal) : ""}

        <div class="activity-sublist">
          ${(c.activities || []).map(a => `
            <div class="activity-pill">
              <div class="item-header">
                <div>
                  <strong>${a.name}</strong>
                  <p>
                    ${a.startDate || a.date || "No date"}
                    ${a.endDate ? ` – ${a.endDate}` : ""}
                    ${a.hours ? ` · ${a.hours} hours` : ""}
                  </p>
                  ${a.role ? `<p><strong>Role:</strong> ${escapeHTML(a.role)}</p>` : ""}
                  ${a.organization ? `<p><strong>Organization:</strong> ${escapeHTML(a.organization)}</p>` : ""}
                  ${a.link ? `<p><a href="${escapeHTML(a.link)}" target="_blank">Link / Evidence</a></p>` : ""}
                  ${a.impact ? `<p>${escapeHTML(a.impact)}</p>` : ""}
                  ${a.skills ? `<p><strong>Skills:</strong> ${escapeHTML(a.skills)}</p>` : ""}
                  ${a.notes ? `<p>${escapeHTML(a.notes)}</p>` : ""}
                </div>

                <div class="action-row">
                  <button class="soft-btn" onclick="toggleEdit('edit-activity-${a.id}')">Edit</button>
                  <button class="delete" onclick="deleteActivity('${c.id}', '${a.id}')">Delete</button>
                </div>
              </div>
            </div>
          `).join("") || "<p>No activities yet.</p>"}
        </div>
      </div>
    `;
  }).join("");
}

export function updateActivity(categoryId, activityId) {
  const data = getData();
  const category = data.categories.find(c => c.id === categoryId);
  const activity = category.activities.find(a => a.id === activityId);
  activity.name = document.getElementById(`activity-name-${activityId}`).value;
  activity.date = document.getElementById(`activity-date-${activityId}`).value;
  activity.hours = Number(document.getElementById(`activity-hours-${activityId}`).value);
  activity.notes = document.getElementById(`activity-notes-${activityId}`).value;
  save();
}

export function updateCategory(id) {
  const data = getData();
  const category = data.categories.find(c => c.id === id);
  category.name = document.getElementById(`category-name-${id}`).value;
  category.goal = Number(document.getElementById(`category-goal-${id}`).value);
  save();
}

export function deleteCategory(id) {
  const data = getData();
  if (!safeConfirmDelete("Delete this activity category and all activities inside it?")) return;
  data.categories = data.categories.filter(c => c.id !== id);
  save();
}

export function deleteActivity(categoryId, activityId) {
  const data = getData();
  if (!safeConfirmDelete()) return;
  const category = data.categories.find(c => c.id === categoryId);
  category.activities = category.activities.filter(a => a.id !== activityId);
  save();
}
