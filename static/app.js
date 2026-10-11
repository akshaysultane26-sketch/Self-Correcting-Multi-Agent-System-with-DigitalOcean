const topicInput = document.getElementById("topic");
const runBtn = document.getElementById("run-btn");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const traceEl = document.getElementById("trace");
const summaryEl = document.getElementById("summary");
const finalEl = document.getElementById("final");

function makeEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function renderEvent(event, index) {
  const card = makeEl("div", "card " + event.agent);
  const title = (index + 1) + ". " + event.agent.toUpperCase();
  card.appendChild(makeEl("h3", "", title));
  card.appendChild(makeEl("div", "meta", "Model: " + event.model));

  if (event.agent === "reviewer") {
    const badge = makeEl("span", "badge " + event.decision.toLowerCase(), event.decision);
    card.appendChild(badge);
    card.appendChild(
      makeEl("p", "", event.feedback ? "Feedback: " + event.feedback : "No changes needed.")
    );
  } else {
    card.appendChild(makeEl("pre", "", event.draft));
    if (event.agent === "reviser") {
      card.appendChild(makeEl("div", "meta", "Revision #" + event.revision_count));
    }
  }
  return card;
}

function errorMessage(data) {
  if (!data || !data.detail) return "Something went wrong.";
  if (typeof data.detail === "string") return data.detail;
  return "Please enter a topic between 2 and 300 characters.";
}

async function runAgents() {
  const topic = topicInput.value.trim();
  if (topic.length < 2) {
    statusEl.textContent = "Please enter a topic (at least 2 characters).";
    statusEl.className = "status error";
    return;
  }

  runBtn.disabled = true;
  statusEl.textContent = "Agents are working... this can take up to a minute.";
  statusEl.className = "status";
  resultsEl.classList.add("hidden");
  traceEl.innerHTML = "";

  try {
    const response = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: topic }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(errorMessage(data));
    }

    data.events.forEach(function (event, i) {
      traceEl.appendChild(renderEvent(event, i));
    });
    summaryEl.textContent =
      "Final decision: " + data.final_decision + " | Revisions used: " + data.revision_count;
    finalEl.textContent = data.final_answer;
    resultsEl.classList.remove("hidden");
    statusEl.textContent = "Done.";
  } catch (err) {
    statusEl.textContent = "Error: " + err.message;
    statusEl.className = "status error";
  } finally {
    runBtn.disabled = false;
  }
}

runBtn.addEventListener("click", runAgents);
topicInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") runAgents();
});
