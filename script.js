// ===================================
// Configuration - 設定區域
// ===================================
const CONFIG = {
    // 設定為 true 可啟用自動送出到 Google Sheets
    // 將下方 URL 替換為您部署的 Google Apps Script Web App URL
    ENABLE_GAS_INTEGRATION: false,
    SCRIPT_URL: 'https://script.google.com/macros/library/d/1v8nDeZNgaeiUn_p5ZQfFvIZsYfUpw0fWy-09mjpoH42OEab1-9Olwe8E/1'
};

// ===================================
// DOM Elements
// ===================================
const form = document.getElementById('workReportForm');
const categoryTabs = document.querySelectorAll('.category-tab');
const subcategoryGroups = document.querySelectorAll('.subcategory-group');
const workDescription = document.getElementById('workDescription');
const charCount = document.getElementById('charCount');
const previewBtn = document.getElementById('previewBtn');
const previewModal = document.getElementById('previewModal');
const closeModal = document.getElementById('closeModal');
const previewContent = document.getElementById('previewContent');
const copyDataBtn = document.getElementById('copyDataBtn');
const confirmSubmit = document.getElementById('confirmSubmit');
const successModal = document.getElementById('successModal');
const closeSuccessModal = document.getElementById('closeSuccessModal');
const workDateInput = document.getElementById('workDate');

// ===================================
// Initialize
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // Set default date to today
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    workDateInput.value = formattedDate;

    // Initialize character counter
    updateCharCounter();

    // Visit time auto-calculation
    const visitStartTime = document.getElementById('visitStartTime');
    const visitEndTime = document.getElementById('visitEndTime');
    visitStartTime.addEventListener('change', calculateVisitDuration);
    visitEndTime.addEventListener('change', calculateVisitDuration);
});

// ===================================
// Category Tab Switching
// ===================================
categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs
        categoryTabs.forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        tab.classList.add('active');

        // Get category name
        const category = tab.dataset.category;

        // Hide all subcategory groups
        subcategoryGroups.forEach(group => {
            group.classList.remove('active');
        });

        // Show selected subcategory group
        const targetGroup = document.querySelector(`.subcategory-group[data-category="${category}"]`);
        if (targetGroup) {
            targetGroup.classList.add('active');
        }
    });
});

// ===================================
// Visit Duration Calculation
// ===================================
function calculateVisitDuration() {
    const startTime = document.getElementById('visitStartTime').value;
    const endTime = document.getElementById('visitEndTime').value;
    const durationDisplay = document.getElementById('visitDurationDisplay');
    const durationText = document.getElementById('visitDuration');

    if (startTime && endTime) {
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);

        if (totalMinutes < 0) {
            totalMinutes += 24 * 60; // 跨日處理
        }

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        let text = '總計 ';
        if (hours > 0) text += `${hours} 小時 `;
        if (minutes > 0) text += `${minutes} 分鐘`;
        if (hours === 0 && minutes === 0) text += '0 分鐘';

        durationText.textContent = text.trim();
        durationDisplay.classList.add('has-value');
    } else {
        durationText.textContent = '請輸入開始與結束時間';
        durationDisplay.classList.remove('has-value');
    }
}

// ===================================
// Character Counter
// ===================================
workDescription.addEventListener('input', updateCharCounter);

function updateCharCounter() {
    const count = workDescription.value.length;
    charCount.textContent = count;

    if (count > 500) {
        charCount.style.color = '#ef4444';
    } else if (count > 400) {
        charCount.style.color = '#f59e0b';
    } else {
        charCount.style.color = '';
    }
}

// ===================================
// Form Data Collection
// ===================================
function collectFormData() {
    const engineerName = document.getElementById('engineerName').value;
    const workDate = document.getElementById('workDate').value;
    const unitName = document.getElementById('unitName').value;

    // Get visit time range
    const visitStartTime = document.getElementById('visitStartTime').value;
    const visitEndTime = document.getElementById('visitEndTime').value;

    // Calculate visit duration
    let visitDuration = '';
    if (visitStartTime && visitEndTime) {
        const [startH, startM] = visitStartTime.split(':').map(Number);
        const [endH, endM] = visitEndTime.split(':').map(Number);
        let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        if (totalMinutes < 0) totalMinutes += 24 * 60;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        let text = '';
        if (hours > 0) text += `${hours} 小時 `;
        if (minutes > 0) text += `${minutes} 分鐘`;
        if (hours === 0 && minutes === 0) text = '0 分鐘';
        visitDuration = text.trim();
    }

    // Collect work types
    const workTypes = [];
    document.querySelectorAll('input[name="workType"]:checked').forEach(checkbox => {
        workTypes.push(checkbox.value);
    });

    const isMaintenanceCustomer = document.querySelector('input[name="isMaintenanceCustomer"]:checked')?.value || '';
    const description = document.getElementById('workDescription').value;

    return {
        engineerName,
        workDate,
        unitName,
        visitStartTime,
        visitEndTime,
        visitDuration,
        workTypes: workTypes.join(', '),
        isMaintenanceCustomer,
        description
    };
}

// ===================================
// Form Validation
// ===================================
function validateForm() {
    const data = collectFormData();
    const errors = [];

    if (!data.engineerName) errors.push('請選擇工程師姓名');
    if (!data.workDate) errors.push('請選擇工作日期');
    if (!data.unitName) errors.push('請輸入單位名稱');
    if (!data.visitStartTime) errors.push('請輸入進場開始時間');
    if (!data.visitEndTime) errors.push('請輸入進場結束時間');
    if (!data.workTypes) errors.push('請至少選擇一項工作類別');
    if (!data.isMaintenanceCustomer) errors.push('請選擇是否為定保戶');
    if (!data.description) errors.push('請輸入詳細工作內容說明');

    return errors;
}

// ===================================
// Preview Modal
// ===================================
previewBtn.addEventListener('click', () => {
    const errors = validateForm();

    if (errors.length > 0) {
        alert('請填寫以下必填欄位：\n\n' + errors.join('\n'));
        return;
    }

    const data = collectFormData();
    showPreview(data);
});

function showPreview(data) {
    // Format date for display
    const dateObj = new Date(data.workDate);
    const formattedDate = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;

    previewContent.innerHTML = `
        <div class="preview-item">
            <span class="preview-label">工程師姓名</span>
            <span class="preview-value">${data.engineerName}</span>
        </div>
        <div class="preview-item">
            <span class="preview-label">工作日期</span>
            <span class="preview-value">${formattedDate}</span>
        </div>
        <div class="preview-item">
            <span class="preview-label">單位名稱</span>
            <span class="preview-value">${data.unitName}</span>
        </div>
        <div class="preview-item">
            <span class="preview-label">進場時段</span>
            <span class="preview-value">${data.visitStartTime} → ${data.visitEndTime}（${data.visitDuration}）</span>
        </div>
        <div class="preview-item">
            <span class="preview-label">工作類別</span>
            <span class="preview-value">${data.workTypes}</span>
        </div>
        <div class="preview-item">
            <span class="preview-label">是否為定保戶</span>
            <span class="preview-value">${data.isMaintenanceCustomer}</span>
        </div>
        <div class="preview-item">
            <span class="preview-label">工作內容說明</span>
            <span class="preview-value">${data.description}</span>
        </div>
    `;

    previewModal.classList.add('active');
}

// Close preview modal
closeModal.addEventListener('click', () => {
    previewModal.classList.remove('active');
});

previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) {
        previewModal.classList.remove('active');
    }
});

// ===================================
// Copy Data for Google Sheets
// ===================================
function formatDataForSheets(data) {
    // Format: Date, Unit, Visit Period, Work Types, Processing Time, Is Maintenance, Description
    // Tab-separated for easy paste into Google Sheets
    const dateObj = new Date(data.workDate);
    const formattedDate = `${dateObj.getFullYear()}/${dateObj.getMonth() + 1}/${dateObj.getDate()}`;

    return [
        formattedDate,
        data.unitName,
        data.visitStartTime,
        data.visitEndTime,
        data.visitDuration,
        data.workTypes,
        data.isMaintenanceCustomer,
        data.description
    ].join('\t');
}

copyDataBtn.addEventListener('click', () => {
    const data = collectFormData();
    const tabSeparatedData = formatDataForSheets(data);

    navigator.clipboard.writeText(tabSeparatedData).then(() => {
        // Change button text temporarily
        const originalHTML = copyDataBtn.innerHTML;
        copyDataBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
            </svg>
            已複製！
        `;
        copyDataBtn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
        copyDataBtn.style.color = 'white';
        copyDataBtn.style.borderColor = 'transparent';

        setTimeout(() => {
            copyDataBtn.innerHTML = originalHTML;
            copyDataBtn.style.background = '';
            copyDataBtn.style.color = '';
            copyDataBtn.style.borderColor = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('複製失敗，請手動複製資料');
    });
});

// ===================================
// Form Submission
// ===================================
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const errors = validateForm();

    if (errors.length > 0) {
        alert('請填寫以下必填欄位：\n\n' + errors.join('\n'));
        return;
    }

    submitForm();
});

confirmSubmit.addEventListener('click', () => {
    submitForm();
});

async function submitForm() {
    const data = collectFormData();
    const tabSeparatedData = formatDataForSheets(data);

    // Disable submit buttons during processing
    const submitBtns = document.querySelectorAll('.btn-primary');
    submitBtns.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.7';
    });

    try {
        // Try to send to Google Sheets if configured
        const gasResult = await sendToGoogleSheets(data);

        if (gasResult.success) {
            console.log('Data successfully sent to Google Sheets');
        } else if (gasResult.reason === 'not_configured') {
            console.log('Google Sheets integration not configured, using clipboard only');
        } else {
            console.warn('Failed to send to Google Sheets, falling back to clipboard');
        }

        // Copy to clipboard
        await navigator.clipboard.writeText(tabSeparatedData);

        // Close preview modal
        previewModal.classList.remove('active');

        // Show success modal
        successModal.classList.add('active');

        // Log data for debugging
        console.log('Form submitted with data:', data);
        console.log('Tab-separated data for Google Sheets:', tabSeparatedData);

        // Store data in localStorage for potential GAS pickup
        const submissions = JSON.parse(localStorage.getItem('workReportSubmissions') || '[]');
        submissions.push({
            ...data,
            submittedAt: new Date().toISOString(),
            sentToGAS: gasResult.success
        });
        localStorage.setItem('workReportSubmissions', JSON.stringify(submissions));

    } catch (err) {
        console.error('Failed to submit:', err);
        alert('資料送出成功，但複製到剪貼簿失敗');
        previewModal.classList.remove('active');
        successModal.classList.add('active');
    } finally {
        // Re-enable submit buttons
        submitBtns.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
        });
    }
}

// ===================================
// Close Success Modal & Reset Form
// ===================================
closeSuccessModal.addEventListener('click', () => {
    successModal.classList.remove('active');
    resetForm();
});

successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
        successModal.classList.remove('active');
        resetForm();
    }
});

function resetForm() {
    form.reset();

    // Reset to default date
    const today = new Date();
    workDateInput.value = today.toISOString().split('T')[0];

    // Reset visit time range
    document.getElementById('visitStartTime').value = '';
    document.getElementById('visitEndTime').value = '';
    document.getElementById('visitDuration').textContent = '請輸入開始與結束時間';
    document.getElementById('visitDurationDisplay').classList.remove('has-value');

    // Reset category tabs to first tab
    categoryTabs.forEach((tab, index) => {
        if (index === 0) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    subcategoryGroups.forEach((group, index) => {
        if (index === 0) {
            group.classList.add('active');
        } else {
            group.classList.remove('active');
        }
    });

    // Reset character counter
    updateCharCounter();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===================================
// Keyboard Shortcuts
// ===================================
document.addEventListener('keydown', (e) => {
    // Close modals on Escape
    if (e.key === 'Escape') {
        previewModal.classList.remove('active');
        successModal.classList.remove('active');
    }

    // Submit on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const errors = validateForm();
        if (errors.length === 0) {
            submitForm();
        }
    }
});

// ===================================
// Google Apps Script Integration Helper
// ===================================
// This function can be used if you set up a Google Apps Script Web App
// to receive form submissions directly

async function sendToGoogleSheets(data) {
    if (!CONFIG.ENABLE_GAS_INTEGRATION || CONFIG.SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
        console.log('Google Apps Script integration is disabled or URL not configured');
        return { success: false, reason: 'not_configured' };
    }

    try {
        const response = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        console.log('Data sent to Google Sheets');
        return { success: true };
    } catch (error) {
        console.error('Failed to send to Google Sheets:', error);
        return { success: false, reason: 'fetch_error', error };
    }
}

// Example Google Apps Script code for receiving the data:
/*
function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = JSON.parse(e.postData.contents);
  
  // Get or create sheet for the engineer
  let sheet = ss.getSheetByName(data.engineerName);
  if (!sheet) {
    sheet = ss.insertSheet(data.engineerName);
    // Add headers
    sheet.appendRow([
      '日期', '單位名稱', '進場開始時間', '進場結束時間', '進場時間總和',
      '工作類別', '是否定保戶', '工作內容說明', '提交時間'
    ]);
  }
  
  // Append the data
  sheet.appendRow([
    data.workDate,
    data.unitName,
    data.visitStartTime,
    data.visitEndTime,
    data.visitDuration,
    data.workTypes,
    data.isMaintenanceCustomer,
    data.description,
    new Date().toISOString()
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput('Work Report API is running');
}
*/
