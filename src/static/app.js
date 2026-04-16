document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    // Hide message after 5 seconds
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function createActivityOption(name) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    return option;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const selectedActivity = activitySelect.value;
      const response = await fetch("/activities", {
        cache: "no-store",
      });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Rebuild dropdown options to avoid duplicates after refreshes
      activitySelect.innerHTML = "";
      activitySelect.appendChild(createActivityOption(""));
      activitySelect.firstElementChild.textContent = "-- Select an activity --";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const sortedParticipants = [...details.participants].sort((a, b) =>
          a.localeCompare(b, undefined, { sensitivity: "base" })
        );
        const participantsMarkup = sortedParticipants.length
          ? `<ul class="participants-list">${sortedParticipants
              .map(
                (participant) =>
                  `<li class="participant-item"><span class="participant-email">${participant}</span><button type="button" class="delete-participant-btn" data-activity="${name}" data-email="${participant}" aria-label="Remove ${participant} from ${name}" title="Remove participant">&#128465;</button></li>`
              )
              .join("")}</ul>`
          : '<p class="no-participants">No participants yet. Be the first to join!</p>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability-row"><strong>Availability:</strong> <span class="spots-badge">${spotsLeft} spots left</span></p>
          <div class="participants-section">
            <p class="participants-title">Participants (${details.participants.length})</p>
            ${participantsMarkup}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        activitySelect.appendChild(createActivityOption(name));
      });

      // Restore selected activity if it still exists after refresh
      if (selectedActivity && activities[selectedActivity]) {
        activitySelect.value = selectedActivity;
      }
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Handle participant removal with event delegation for dynamic card content
  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".delete-participant-btn");
    if (!deleteButton) {
      return;
    }

    const activity = deleteButton.dataset.activity;
    const email = deleteButton.dataset.email;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "Unable to remove participant.", "error");
      }
    } catch (error) {
      showMessage("Failed to remove participant. Please try again.", "error");
      console.error("Error removing participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
