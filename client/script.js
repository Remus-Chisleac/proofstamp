const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const authorInput = document.getElementById("authorInput");
const result = document.getElementById("result");
const resultTitle = document.getElementById("resultTitle");
const resultContent = document.getElementById("resultContent");
const verifyHash = document.getElementById("verifyHash");
const verifyBtn = document.getElementById("verifyBtn");

const API_BASE_URL = "/api";

// Update drop zone state based on author input
function updateDropZoneState() {
  const authorValue = authorInput.value.trim();
  if (authorValue) {
    dropZone.classList.remove("disabled");
  } else {
    dropZone.classList.add("disabled");
  }
}

// Initial state check
updateDropZoneState();

// Listen for author input changes
authorInput.addEventListener("input", updateDropZoneState);

// Prevent default drag behaviors
["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, preventDefaults, false);
  document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Highlight drop zone when item is dragged over it
["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(
    eventName,
    () => {
      dropZone.classList.add("dragover");
    },
    false
  );
});

["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(
    eventName,
    () => {
      dropZone.classList.remove("dragover");
    },
    false
  );
});

// Handle dropped files
dropZone.addEventListener("drop", handleDrop, false);
dropZone.addEventListener("click", () => {
  const authorValue = authorInput.value.trim();
  if (!authorValue) {
    showResult("error", "Validation Error", "Please enter an author name before selecting a file");
    authorInput.focus();
    return;
  }
  fileInput.click();
});
fileInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    handleFiles(e.target.files);
  }
});

function handleDrop(e) {
  const authorValue = authorInput.value.trim();
  if (!authorValue) {
    e.preventDefault();
    e.stopPropagation();
    showResult("error", "Validation Error", "Please enter an author name before dropping a file");
    return;
  }

  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
}

async function handleFiles(files) {
  if (files.length === 0) return;

  const authorValue = authorInput.value.trim();
  if (!authorValue) {
    showResult("error", "Validation Error", "Please enter an author name before processing a file");
    return;
  }

  const file = files[0];
  showResult("loading", "Processing file...", "");

  try {
    // Calculate SHA-256 hash using SubtleCrypto API (file content only, no author)
    const hash = await calculateSHA256(file);

    // Send hash and author to backend
    const response = await fetch(`${API_BASE_URL}/sign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hash: hash,
        author: authorValue,
        metadata: {
          filename: file.name,
          size: file.size,
          type: file.type,
        },
      }),
    });

    const data = await response.json();

    if (response.status === 201) {
      // Success - new signature created
      const timestamp = new Date(data.timestamp);
      showResult(
        "success",
        "✓ File timestamped successfully!",
        `
                  <div class="hash-display">
                      <strong>Hash:</strong><br>${hash}
                  </div>
                  <div class="timestamp">
                      <strong>Timestamp:</strong> ${timestamp.toLocaleString()}
                  </div>
                  ${data.author ? `<div class="timestamp"><strong>Author:</strong> ${data.author}</div>` : ""}
                  ${data.id ? `<div class="timestamp"><strong>ID:</strong> ${data.id}</div>` : ""}
              `
      );
    } else if (response.status === 409) {
      // Conflict - file already claimed
      const originalTimestamp = new Date(data.timestamp);
      const originalAuthor = data.author || "Unknown";
      showResult(
        "conflict",
        "⚠ File already claimed!",
        `
                  <div style="margin-bottom: 10px;">
                      Originally registered by <strong>${originalAuthor}</strong> on <strong>${originalTimestamp.toLocaleString()}</strong>
                  </div>
                  <div class="hash-display">
                      <strong>Hash:</strong><br>${hash}
                  </div>
              `
      );
    } else {
      showResult("error", "Error", data.error || "Failed to timestamp file");
    }
  } catch (error) {
    showResult("error", "Error", error.message || "Failed to process file");
  }
}

async function calculateSHA256(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

function showResult(type, title, content) {
  result.className = `result ${type}`;
  result.style.display = "block";
  resultTitle.textContent = title;
  resultContent.innerHTML = content;
}

// Verify functionality
verifyBtn.addEventListener("click", async () => {
  const hash = verifyHash.value.trim();
  if (!hash) {
    showResult("error", "Error", "Please enter a hash to verify");
    return;
  }

  showResult("loading", "Verifying...", "");
  verifyBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE_URL}/verify/${hash}`);
    const data = await response.json();

    if (response.ok) {
      const timestamp = new Date(data.timestamp);
      showResult(
        "success",
        "✓ Signature verified!",
        `
                  <div class="hash-display">
                      <strong>Hash:</strong><br>${data.hash}
                  </div>
                  <div class="timestamp">
                      <strong>Author:</strong> ${data.author || "Unknown"}
                  </div>
                  <div class="timestamp">
                      <strong>Timestamp:</strong> ${timestamp.toLocaleString()}
                  </div>
                  <div class="timestamp">
                      <strong>ID:</strong> ${data.id}
                  </div>
                  ${
                    data.metadata
                      ? `<div class="timestamp"><strong>Metadata:</strong> ${JSON.stringify(
                          data.metadata,
                          null,
                          2
                        )}</div>`
                      : ""
                  }
              `
      );
    } else {
      showResult("error", "Not Found", data.error || "Signature not found");
    }
  } catch (error) {
    showResult("error", "Error", error.message || "Failed to verify signature");
  } finally {
    verifyBtn.disabled = false;
  }
});

// Allow Enter key to trigger verify
verifyHash.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    verifyBtn.click();
  }
});

