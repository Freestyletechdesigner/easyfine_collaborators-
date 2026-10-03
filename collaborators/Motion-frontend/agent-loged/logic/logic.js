let pendingEditSubmitCallback = null;
document.addEventListener('DOMContentLoaded', () => {

    // Global variable within DOMContentLoaded scope to store the agent's ID
    let currentAgentId = null;

    // ── Auth ──────────────────────────────────────────────
    async function checkAuth() {
        try {
            const response = await fetch('/api/agent/profile', { credentials: 'include' });
            const data = await response.json();
            const verify = document.querySelector('.verify')
            const verifyText = document.querySelector('.verifyText')
            if (!data.agent) {
                window.location.href = '/login-agent';
                return false;
            }

            // Capture and store the agent's ID
            currentAgentId = data.agent._id || data.agent.id;

            document.getElementById('agent-name').textContent = data.agent.name.length > 8 
            ? data.agent.name.slice(0, 8) + '...' 
            : data.agent.name;
            loadProfilePicture();

            // Check if agent stand is "verified agent"
            const isVerified = data.agent.stand && data.agent.stand.toLowerCase() === 'verified agent';

            if (isVerified) {
                document.querySelectorAll('[href="/agent-verification"]').forEach(el => {
                    el.style.display = 'none';
                });
                verify.style.display = 'flex'
                verifyText.style.display = 'flex'
            } else {
                verify.style.display = 'none'
                verifyText.style.display = 'none'
            }

            // Check if the agent has boosted their account or an individual listing
            const isBoosted = !!(data.agent.boosted || data.agent.isBoosted || data.agent.boost);

            // Dynamically populate notifications based on agent's real-time state
            initializeNotifications(isVerified, isBoosted);

            return true;
        } catch (error) {
            window.location.href = '/login-agent';
            return false;
        }
    }

    const uploadPic = document.querySelector('.upload-pic')

    async function loadProfilePicture() {
        try {
            const response = await fetch('/api/agent/profile/picture', { credentials: 'include' });
            const data = await response.json();
            if (data.success && data.profilePicture) {
                document.getElementById('profile-picture').src = data.profilePicture;
            } else if (!data.profilePicture) {
                uploadPic.style.display = 'flex'
                setTimeout(() => {
                    uploadPic.style.display = 'none'
                }, 2000);
            }
        } catch (error) {
            console.error('Error loading profile picture:', error);
        }
    }

    window.logout = async function () {
        try {
            const response = await fetch('/api/agent/logout', { method: 'POST' });
            const data = await response.json();
            if (data.success) window.location.href = '/login-agent';
        } catch (error) {
            window.location.href = '/login-agent';
        }
    };

    // ── Nav ───────────────────────────────────────────────
    const nav2 = document.getElementById('nav2');
    const hamburger = document.getElementById('hamburger');

    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        nav2.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    window.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target)) {
            hamburger.classList.remove('active');
            nav2.classList.remove('active');
        }
    });

    // ── Type toggle (Land hides beds/baths, shows plot) ──────
    const typeSelect = document.getElementById('typeSelect');
    const groupBeds   = document.getElementById('groupBeds');
    const groupBaths = document.getElementById('groupBaths');
    const landPlot = document.getElementById('groupLand');
    if (landPlot) landPlot.style.display = 'none';

    function handleTypeChange() {
        const isLand = typeSelect.value === 'land';
        if (groupBeds) groupBeds.style.display  = isLand ? 'none' : '';
        if (groupBaths) groupBaths.style.display = isLand ? 'none' : '';
        if (isLand) {
            if (propertyForm) {
                const bedsInput = propertyForm.querySelector('[name="beds"]');
                const bathsInput = propertyForm.querySelector('[name="baths"]');
                if (bedsInput) bedsInput.value = '';
                if (bathsInput) bathsInput.value = '';
            }
            if (landPlot) landPlot.style.display = '';
        } else {
            if (landPlot) landPlot.style.display = 'none';
        }
    }

    if (typeSelect) {
        typeSelect.addEventListener('change', handleTypeChange);
    }

    // ── Modal ─────────────────────────────────────────────
    window.openModal = function () {
        document.getElementById('modalOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
        initializeFeatures();
        handleTypeChange();
    };

    window.closeModal = function () {
        document.getElementById('modalOverlay').classList.remove('active');
        document.body.style.overflow = 'auto';
        resetForm();
    };

    function resetForm() {
        if (propertyForm) propertyForm.reset();
        selectedImages = [];
        // clear pinned coordinates
        const latInput = document.getElementById('propLatitude');
        const lngInput = document.getElementById('propLongitude');
        if (latInput) latInput.value = '';
        if (lngInput) lngInput.value = '';
        updateImagePreview();
        selectedFeatures.clear();
        updateFeaturesInput();
    }

    // ── Features ──────────────────────────────────────────
    const availableFeatures = [
        'Swimming Pool', 'Gym', 'Parking', 'Garden', 'Balcony',
        'Security', 'Elevator', 'Pet Friendly', 'Furnished', 'Air Conditioning'
    ];
    const selectedFeatures = new Set();

    function initializeFeatures() {
        const container = document.getElementById('featuresContainer');
        if (!container) return;
        container.innerHTML = '';
        availableFeatures.forEach(feature => {
            const tag = document.createElement('div');
            tag.className = 'feature-tag';
            tag.textContent = feature;
            tag.onclick = () => toggleFeature(feature, tag);
            container.appendChild(tag);
        });
    }

    function toggleFeature(feature, element) {
        if (selectedFeatures.has(feature)) {
            selectedFeatures.delete(feature);
            element.classList.remove('selected');
        } else {
            selectedFeatures.add(feature);
            element.classList.add('selected');
        }
        updateFeaturesInput();
    }

    function updateFeaturesInput() {
        const input = document.getElementById('featuresInput');
        if (input) input.value = Array.from(selectedFeatures).join(',');
    }

    // ── Image Upload & Drag-Drop ──────────────────────────
    const propertyForm = document.getElementById('propertyForm');

    // Live price formatter for post form
    const postPriceInput = document.getElementById('postPrice')
        || (propertyForm && propertyForm.querySelector('[name="price"]'));
    if (postPriceInput) {
        postPriceInput.addEventListener('input', function () {
            const raw = this.value.replace(/[^0-9]/g, '');
            this.value = raw ? Number(raw).toLocaleString('en-NG') : '';
            const len = this.value.length;
            this.setSelectionRange(len, len);
        });
    }

    const imageInput = document.getElementById('fileInput');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    
    // Explicit array declaration to prevent ReferenceErrors during execution
    let selectedImages = [];

    // Setup drag & drop targets
    const newPostDropZone = document.querySelector('#propertyForm .image-upload-zone');
    const editPostDropZone = document.querySelector('#editPropertyForm .image-upload-zone');
    const editFileInput = document.getElementById('editFileInput');

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Prevent global browser drop behavior (which opens the image file in the browser window)
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Unified file handling logic for both Upload and Edit actions
    async function handleFiles(files, isEdit = false) {
        const containerId = isEdit ? 'editImagePreviewContainer' : 'imagePreviewContainer';
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.error(`Container ${containerId} not found!`);
            return;
        }

        const newFiles = [];

        for (const file of Array.from(files)) {
            if (!file.type.startsWith('image/')) {
                alertBox.error('Invalid File', `${file.name} is not an image file`);
                continue;
            }

            // Create temporary preview loading item
            const tempItem = document.createElement('div');
            tempItem.className = 'preview-item';
            tempItem.innerHTML = `<div class="spinner-container"><i class="fa-solid fa-spinner spinner2"></i></div>`;
            container.appendChild(tempItem);

            let fileToProcess = file;
            if (file.size > 1 * 1024 * 1024) {
                try {
                    fileToProcess = await compressImage(file);
                } catch (err) {
                    console.error("Compression failed, using original:", err);
                }
            }

            tempItem.remove();

            if (fileToProcess.size > 10 * 1024 * 1024) {
                alertBox.error('File Too Large', `${file.name} remains above 10MB.`);
                continue;
            }

            newFiles.push(fileToProcess);
        }

        if (isEdit) {
            editImages = [...editImages, ...newFiles];
            updateEditPreview();
        } else {
            selectedImages = [...selectedImages, ...newFiles];
            updateImagePreview();
        }
    }

    // Configure drag action stylings and callback execution
    function setupDragAndDrop(dropZone, isEdit) {
        if (!dropZone) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.style.borderColor = '#0d7068';
                dropZone.style.background  = 'linear-gradient(135deg, #e8fffe 0%, #d4fcfb 100%)';
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.style.borderColor = '#66eae3';
                dropZone.style.background  = 'linear-gradient(135deg, #f5fdfd 0%, #e8fffe 100%)';
            });
        });

        dropZone.addEventListener('drop', (e) => {
            if (e.dataTransfer && e.dataTransfer.files) {
                handleFiles(e.dataTransfer.files, isEdit);
            }
        });
    }

    // Initialize both drag and drop zones
    setupDragAndDrop(newPostDropZone, false);
    setupDragAndDrop(editPostDropZone, true);

    // Stop click events bubbling up from input elements to parent divs to prevent recursive click loops
    if (imageInput) {
        imageInput.addEventListener('click', (e) => e.stopPropagation());
        imageInput.addEventListener('change', (e) => handleFiles(e.target.files, false));
    }

    if (editFileInput) {
        editFileInput.addEventListener('click', (e) => e.stopPropagation());
        editFileInput.addEventListener('change', (e) => handleFiles(e.target.files, true));
    }

    function updateImagePreview() {
        if (!imagePreviewContainer) return;
        imagePreviewContainer.innerHTML = '';
        selectedImages.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const item = document.createElement('div');
                item.className = 'preview-item';
                item.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button type="button" class="remove-preview" onclick="removeImage(${index})">×</button>
                `;
                imagePreviewContainer.appendChild(item);
            };
            reader.readAsDataURL(file);
        });
    }

    window.removeImage = function (index) {
        selectedImages.splice(index, 1);
        updateImagePreview();
    };

// Add this helper function to your logic.js
async function compressImage(file, maxWidth = 1000, quality = 0.6) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                
                // 1. Lower the maxWidth for 25MB+ files to significantly reduce pixel count
                let width = img.width;
                let height = img.height;
                const scale = Math.min(maxWidth / width, 1);
                canvas.width = width * scale;
                canvas.height = height * scale;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // 2. Export as Blob
                canvas.toBlob((blob) => {
                    if (!blob) return reject(new Error('Canvas conversion failed'));
                    
                    // If the result is still > 1MB, try a lower quality recursively
                    if (blob.size > 1024 * 1024 && quality > 0.3) {
                        return resolve(compressImage(file, maxWidth * 0.8, quality - 0.2));
                    }

                    resolve(new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    }));
                }, 'image/jpeg', quality);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

    // ── Submit ────────────────────────────────────────────
window.submitProperty = async function () {
    const submitBtn = document.getElementById('submit');
    
    // Look up the form directly by its exact DOM element reference
    const currentForm = document.getElementById('uploadPropertyForm') || document.getElementById('propertyForm');
    
    if (!currentForm) {
        console.error("Property form element could not be found in the DOM.");
        return;
    }

    // Stop execution early if already currently in a loading state
    if (submitBtn.disabled) return;

    const spinner = submitBtn.querySelector('.spinner');
    const btnText = submitBtn.querySelector('.btn-text');

    // 1. Image validation check using your custom alertBox UI file
    if (!selectedImages || selectedImages.length === 0) {
        alertBox.warning('No Images', 'Please upload at least one image');
        return;
    }

    // 2. Form Input Payload Content Extractor
    const emojiOrSymbol = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FEFF}!@#$%^&*()+=\[\]{}<>?\\|`~]/u;
    const textOnly      = /^[a-zA-Z0-9\s,.\-'"\/()]+$/;
    const numbersOnly   = /^\d+(\.\d+)?$/;

    const title    = currentForm.querySelector('[name="title"]').value.trim();
    const price    = currentForm.querySelector('[name="price"]').value.trim().replace(/[^0-9]/g, '');
    const category = currentForm.querySelector('[name="category"]').value;
    const location = currentForm.querySelector('[name="location"]').value.trim();
    const beds     = currentForm.querySelector('[name="beds"]').value.trim();
    const baths    = currentForm.querySelector('[name="baths"]').value.trim();
    const area     = currentForm.querySelector('[name="area"]').value.trim();
    const desc     = currentForm.querySelector('[name="description"]').value.trim();

    // Field Validations Execution System
    if (!title) { alertBox.warning('Missing Field', 'Property title is required'); return; }
    if (emojiOrSymbol.test(title)) { alertBox.error('Invalid Title', 'Title must not contain emojis or special symbols'); return; }
    if (!price) { alertBox.warning('Missing Field', 'Price is required'); return; }
    if (!numbersOnly.test(price)) { alertBox.error('Invalid Price', 'Price must be numbers only'); return; }
    if (!category) { alertBox.warning('Missing Field', 'Please select a listing category'); return; }
    if (!location) { alertBox.warning('Missing Field', 'Location is required'); return; }
    if (emojiOrSymbol.test(location)) { alertBox.error('Invalid Location', 'Location must not contain emojis or special symbols'); return; }
    
    const typeValue = currentForm.querySelector('[name="type"]').value;
    if (typeValue !== 'land') {
        if (beds && !numbersOnly.test(beds)) { alertBox.error('Invalid Bedrooms', 'Bedrooms must be a number only'); return; }
        if (baths && !numbersOnly.test(baths)) { alertBox.error('Invalid Bathrooms', 'Bathrooms must be a number only'); return; }
    }
    if (area && emojiOrSymbol.test(area)) { alertBox.error('Invalid Area', 'Area must not contain emojis or special symbols'); return; }
    if (desc && emojiOrSymbol.test(desc)) { alertBox.error('Invalid Description', 'Description must not contain emojis or special symbols'); return; }

    // DUAL-FALLBACK ELEMENT SELECTOR (Checks both ID and Name attributes)
    const latInput = document.getElementById('propLatitude') || currentForm.querySelector('[name="latitude"]');
    const lngInput = document.getElementById('propLongitude') || currentForm.querySelector('[name="longitude"]');

    // 3. Geocoding Fallback Checker & Strict Map Coordinates Enforcement
    const latValue = latInput ? latInput.value.trim() : "";
    const lngValue = lngInput ? lngInput.value.trim() : "";

    // If coordinates are blank, zero, or missing entirely, halt and trigger map
    if (!latValue || !lngValue || latValue === "0" || lngValue === "0" || isNaN(latValue) || isNaN(lngValue)) {
        submitBtn.disabled = true;
        if (spinner) spinner.style.display = 'inline-block';
        if (btnText) {
            btnText.style.display = 'inline';
            btnText.textContent = 'Checking location...';
        }

        try {
            const coords = await getCoordinatesWithFallback(location);
            
            if (coords) {
                if (latInput) latInput.value = coords.lat;
                if (lngInput) lngInput.value = coords.lon;
                
                // Cleanly unlock and let execution fall through naturally to Step 4
                submitBtn.disabled = false;
                if (spinner) spinner.style.display = 'none';
                if (btnText) {
                    btnText.style.display = 'inline';
                    btnText.textContent = 'Publish Listing';
                }
            } else {
                // Address could not be found automatically - FORCE manual map pin pick
                alertBox.error('Location Required', 'Could not locate your address automatically. You must pin the property location manually on the map.', () => {
                    
                    submitBtn.disabled = false;
                    if (spinner) spinner.style.display = 'none';
                    if (btnText) {
                        btnText.style.display = 'inline';
                        btnText.textContent = 'Publish Listing';
                    }

                    if (typeof openMapPicker === 'function') {
                        openMapPicker(location, ({ lat, lng }) => {
                            if (latInput) latInput.value = lat;
                            if (lngInput) lngInput.value = lng;
                            
                            // Programmatically trigger a fresh button click to re-verify safely
                            submitBtn.click();
                        });
                    } else {
                        console.error("The map function 'openMapPicker' is not accessible globally.");
                    }
                });
                return; // ABSOLUTE HARD STOP: Exits function instantly, prevents API send!
            }
        } catch (err) {
            console.error("Geocoding workflow error:", err);
            submitBtn.disabled = false;
            if (spinner) spinner.style.display = 'none';
            if (btnText) {
                btnText.style.display = 'inline';
                btnText.textContent = 'Publish Listing';
            }
            alertBox.error('Map Error', 'Could not fetch location data. Please pin manually.');
            return; 
        }
    }

    // 3.5 ABSOLUTE EMERGENCY GUARD RAIL (Will absolutely stop submit if values are missing)
    const finalLat = latInput ? latInput.value.trim() : "";
    const finalLng = lngInput ? lngInput.value.trim() : "";
    if (!finalLat || !finalLng || finalLat === "0" || finalLng === "0") {
        alertBox.error('Map Pin Required', 'Please choose a location coordinates point on the map picker interface.');
        return;
    }

    // 4. Form Data Payload Compilation Track
    submitBtn.disabled        = true;
    if (spinner) spinner.style.display = 'inline-block';
    if (btnText) {
        btnText.style.display = 'inline';
        btnText.textContent = 'Loading'
    };

    const formData = new FormData(currentForm);
    
    // Ensure the values are manually assigned to formData just in case names mismatch in HTML
    formData.set('latitude', finalLat);
    formData.set('longitude', finalLng);
    
    formData.delete('file'); // Strip empty file input defaults
    selectedImages.forEach(file => formData.append('file', file)); 

    try {
        const response = await fetch('/api/agent/post', { 
            method: 'POST', 
            body: formData 
        });
        const data = await response.json();

        if (response.ok && data.success) {
            alertBox.success('Success', 'Property posted successfully! make sure to click on Deal Close after sale', () => {
                // Clear out map coordinate inputs completely so the next listing is clean
                if (latInput) latInput.value = '';
                if (lngInput) lngInput.value = '';
                
                closeModal();
                if (typeof loadProperties === 'function') {
                    loadProperties(true);
                } else {
                    window.location.reload();
                }
            });
            const emptyState = document.getElementById('propertiesEmpty');
            if (emptyState) emptyState.style.display = 'none';
        } else {
            alertBox.error('Failed', data.message || 'Failed to post property');
        }
    } catch (error) {
        console.error('Submit API connection error:', error);
        alertBox.error('Error', 'Error posting property. Please check your network connection.');
    } finally {
        // 5. Ultimate Cleanup Lifecycle Reset
        submitBtn.disabled    = false;
        if (spinner) spinner.style.display = 'none';
        if (btnText) {
            btnText.style.display = 'inline';
            btnText.textContent   = 'Publish Listing';
        }
    }
};

// ── Geocoding Helper Function ────────────────────────
// Only auto-accept very close matches.
// Otherwise force the user to pin manually.

async function getCoordinatesWithFallback(locationText) {
    if (!locationText) return null;

    try {
        const searchText = `${locationText}, Enugu, Nigeria`;
        console.log('🌍 Geocoding:', searchText);

        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&limit=5&addressdetails=1`;

        const response = await fetch(url, {
            headers: {
                'Accept-Language': 'en'
            }
        });

        const data = await response.json();
        console.log('📦 Nominatim Results:', data);

        if (!data || !data.length) {
            console.warn('❌ No location results returned');
            return null;
        }

        const first = data[0];
        const displayName = (first.display_name || '').toLowerCase();

        // ── THE FIX: EXTRACT SIGNIFICANT KEYWORDS TO ACCURATELY VALIDATE LOCATIONS ──
        const cleanWords = (str) => {
            return str
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // Strip accents/diacritics
                .replace(/[^\w\s-]/g, ' ')       // Replace punctuation with whitespace
                .split(/\s+/)
                .filter(w => w.length > 1 && !['no', 'no.', 'street', 'road', 'layout', 'lane', 'avenue', 'close', 'enugu', 'nigeria'].includes(w));
        };

        const searchWords = cleanWords(locationText);

        let matched = false;
        if (searchWords.length === 0) {
            // If the query only contained descriptors or place names, trust Nominatim's internal search matches
            matched = true;
        } else {
            // Match succeeds if ANY of the primary area keywords overlap with the returned location profile
            matched = searchWords.some(word => displayName.includes(word));
        }

        console.log('🔍 Relaxed Match Check:', {
            searchWords,
            result: displayName,
            matched
        });

        if (!matched) {
            console.warn('❌ Result does not match significant keywords of user input');
            return null;
        }

        return {
            lat: parseFloat(first.lat),
            lon: parseFloat(first.lon)
        };

    } catch (error) {
        console.error('❌ Nominatim API connection error:', error);
        return null;
    }
}
    // ── Card Menu ─────────────────────────────────────────
    window.toggleCardMenu = function(id) {
        const menu = document.getElementById(`menu-${id}`);
        document.querySelectorAll('.card-menu.open').forEach(m => {
            if (m.id !== `menu-${id}`) m.classList.remove('open');
        });
        menu.classList.toggle('open');
    };

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.card-menu-wrap')) {
            document.querySelectorAll('.card-menu.open').forEach(m => m.classList.remove('open'));
        }
    });

    window.deleteProperty = function(id) {
        alertBox.confirm(
            'Delete Property',
            'Are you sure you want to delete this listing? This cannot be undone.',
            async () => {
                try {
                    const res  = await fetch(`/api/agent/property/${id}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (res.ok && data.success) {
                        document.getElementById(`card-${id}`)?.remove();
                        const remaining = document.querySelectorAll('.property-card').length;
                        document.getElementById('property-count').textContent = remaining;
                        if (!remaining) document.getElementById('propertiesEmpty').style.display = 'block';
                        alertBox.success('Deleted', 'Property removed successfully');
                    } else {
                        alertBox.error('Failed', data.message || 'Could not delete property');
                    }
                } catch (err) {
                    alertBox.error('Error', 'Something went wrong. Please try again.');
                }
            }
        );
    };

window.toggleDeal = async function(id, isClosed) {
        try {
            const res = await fetch(`/api/agent/property/${id}/deal`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isClosed })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alertBox.success('Success', data.message, () => {
                    // Instantly reload agent property deck
                    loadProperties(true);
                });
            } else {
                alertBox.error('Failed', data.message || 'Could not update deal status.');
            }
        } catch (err) {
            console.error('Deal Toggle Error:', err);
            alertBox.error('Error', 'Something went wrong. Please check your network connection.');
        }
    };

    window.shareProperty = async function(id) {
        const url = `${window.location.origin}/property?id=${id}`;
        
        if (navigator.share) {
            try {
            await navigator.share({ title: 'Check out this property', url })
            } catch (err) {
              copyToClipboard(url)
            }
        } else {
            copyToClipboard(url);
        }
    };

    function copyToClipboard(url) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url)
                .then(() => alertBox.success('Link Copied', 'Property link copied to clipboard'))
                .catch(() => fallbackCopy(url));
        } else {
            fallbackCopy(url);
        }
    }

    function fallbackCopy(url) {
        const el = document.createElement('textarea');
        el.value = url;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        alertBox.success('Link Copied', 'Property link copied to clipboard');
    }

// Keep track of pagination state out of function re-initialization scope
    let currentPropertyPage = 1; 
    let isPropertyLoading = false;
    let hasMorePropertiesToScroll = true; // Prevents calling the API when the database runs out of listings
    const loadedPropertyPageCache = {};   // Memory cache bucket storing property parameters by page block index

    // ── Skeleton Loader Element ──────────────────────────────────
    function getSkeletonHTML() {
        return Array(4).fill(`
            <div class="skeleton-card temporary-skeleton" style="background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 14px rgba(0,0,0,0.06); min-height: 380px;">
                <div class="skeleton skeleton-img" style="height:200px; background:#e0e0e0; animation: pulse 1.5s infinite ease-in-out;"></div>
                <div class="skeleton-body" style="padding:15px;">
                    <div class="skeleton skeleton-line" style="width:60%; height:15px; margin-bottom:10px; background:#e0e0e0; animation: pulse 1.5s infinite ease-in-out;"></div>
                    <div class="skeleton skeleton-line" style="width:40%; height:12px; margin-bottom:10px; background:#e0e0e0; animation: pulse 1.5s infinite ease-in-out;"></div>
                    <div class="skeleton skeleton-line" style="width:80%; height:12px; background:#e0e0e0; animation: pulse 1.5s infinite ease-in-out;"></div>
                </div>
            </div>
        `).join('');
    }

    // ── Properties Grid ───────────────────────────────────
    window.loadProperties = async function (isNewLoad = false) {
        // Prevent overlapping duplicate API requests if user click-spams or scroll triggers fire rapidly
        if (isPropertyLoading) return; 
        
        if (isNewLoad) {
            currentPropertyPage = 1;
            hasMorePropertiesToScroll = true;
            // Clear out local property blocks dictionary cache memory
            Object.keys(loadedPropertyPageCache).forEach(k => delete loadedPropertyPageCache[k]);
            const gridEl = document.getElementById('propertiesGrid');
            if (gridEl) gridEl.innerHTML = '';
        }

        // If backend already returned hasMore = false on previous scroll iterations, exit early
        if (!hasMorePropertiesToScroll) return;

        const grid  = document.getElementById('propertiesGrid');
        const empty = document.getElementById('propertiesEmpty');
        const count = document.getElementById('property-count');

        isPropertyLoading = true;

        // Inject skeletons carefully without wiping out previous items if appending downwards
        if (currentPropertyPage === 1) {
            grid.innerHTML = getSkeletonHTML();
            empty.style.display = 'none';
        } else {
            grid.insertAdjacentHTML('beforeend', `<div id="pagination-skeletons" style="display: contents;">${getSkeletonHTML()}</div>`);
        }

        try {
            const res  = await fetch(`/api/agent/property?page=${currentPropertyPage}`);
            const data = await res.json();

            // Remove temporary skeletons safely before determining layout assignments
            if (currentPropertyPage === 1) {
                grid.innerHTML = '';
            } else {
                const tempSkeletons = document.getElementById('pagination-skeletons');
                if (tempSkeletons) tempSkeletons.remove();
            }

            if (!data.success || !data.property || !data.property.length) {
                if (currentPropertyPage === 1) {
                    empty.style.display = 'block';
                    count.textContent = '0';
                }
                hasMorePropertiesToScroll = false;
                isPropertyLoading = false;
                return;
            }

            // Sync the updated flag tracking boundary passed down from your backend controller layout
            hasMorePropertiesToScroll = Object.prototype.hasOwnProperty.call(data, 'hasMore') ? data.hasMore : true;

            // Update visible list header counters using explicit metrics from totalPosts parameter
            if (currentPropertyPage === 1) {
                count.textContent = data.totalPosts || data.property.length; 
            } else if (data.totalPosts) {
                count.textContent = data.totalPosts;
            } else {
                count.textContent = parseInt(count.textContent) + data.property.length;
            }

            // Save raw listing objects within client dictionary memory index cache
            loadedPropertyPageCache[currentPropertyPage] = data.property;

            // Generate a separate virtual block wrapper element inside your native CSS Grid
            renderVirtualBlockSection(currentPropertyPage, data.property);
            
            // Prepare increment step for the next pagination invocation trigger
            currentPropertyPage++;

        } catch (err) {
            console.error("Failed to load properties:", err);
            if (currentPropertyPage === 1) {
                grid.innerHTML = '';
                empty.style.display = 'block';
                count.textContent = '0';
            } else {
                const tempSkeletons = document.getElementById('pagination-skeletons');
                if (tempSkeletons) tempSkeletons.remove();
            }
        } finally {
            isPropertyLoading = false;
        }
    };

    // ── Virtual DOM Block Group Constructor ────────────────
    function renderVirtualBlockSection(pageNumber, propertyArray) {
        const grid = document.getElementById('propertiesGrid');
        if (!grid) return;

        const blockWrapper = document.createElement('div');
        blockWrapper.id = `virtual-page-block-${pageNumber}`;
        blockWrapper.className = 'virtual-page-block';
        blockWrapper.style.cssText = 'display: contents;'; 
        blockWrapper.setAttribute('data-status', 'active');

        // Compile HTML strings 
        let cardsHTML = '';
        propertyArray.forEach(p => {
            cardsHTML += propertyCard(p);
        });
        blockWrapper.innerHTML = cardsHTML;

        grid.appendChild(blockWrapper);

        // Attach memory recycling Visibility Observer tracking hooks to this specific container row block
        setupVirtualBlockObserver(blockWrapper, pageNumber);
    }

    // ── Intersection Memory Balancing Recycler ─────────────
    function setupVirtualBlockObserver(blockContainer, pageNumber) {
        let initialized = false;
        const observerOptions = {
            root: null, 
            rootMargin: '800px 0px 800px 0px', 
            threshold: 0.0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const propertiesList = loadedPropertyPageCache[pageNumber];
                if (!propertiesList) return;

                // On first layout computation pass, prevent collapsing standard render nodes
                if (!initialized) {
                    initialized = true;
                    if (!entry.isIntersecting) {
                        return; 
                    }
                }

                if (entry.isIntersecting) {
                    // ── USER SCROLLED NEAR LISTINGS: Re-render heavy image cards instantly ──
                    if (blockContainer.getAttribute('data-status') !== 'active') {
                        let innerCardsHTML = '';
                        propertiesList.forEach(p => {
                            innerCardsHTML += propertyCard(p);
                        });
                        blockContainer.innerHTML = innerCardsHTML;
                        blockContainer.setAttribute('data-status', 'active');
                    }
                } else {
                    // ── USER SCROLLED FAR AWAY (UP OR DOWN): Purge content layout elements to prevent crashes ──
                    if (blockContainer.getAttribute('data-status') === 'active') {
                        const actualBlockHeight = blockContainer.getBoundingClientRect().height;

                        blockContainer.innerHTML = ''; 
                        blockContainer.setAttribute('data-status', 'purged');

                        // Create an empty layout filler spacer spanning full widths
                        const memorySpacer = document.createElement('div');
                        memorySpacer.className = 'virtual-spacer';
                        memorySpacer.style.cssText = `grid-column: 1 / -1; height: ${actualBlockHeight || 380}px; width: 100%; display: block;`;
                        blockContainer.appendChild(memorySpacer);
                    }
                }
            });
        }, observerOptions);

        observer.observe(blockContainer);
    }

    // ── Infinite Downwards Scroll Listener ─────────────────
    window.addEventListener('scroll', () => {
        // If we are currently communicating with MongoDB or reached absolute totals, stop operations
        if (isPropertyLoading || !hasMorePropertiesToScroll) return;

        // Fetch the next 8 items whenever the agent scrolls within 400px of the footer page bottom limits
        if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 400) {
            window.loadProperties(false);
        }
    });

function propertyCard(p) {
        const imgSrc = p.imageNames && p.imageNames.length
            ? `/agent-loged/upload-property/${p.imageNames[0]}`
            : 'profile.png';
        const price = Number(p.price).toLocaleString();
        const date = new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const isLand = (p.type || '').toLowerCase() === 'land';
        const isVerified = (p.stand || '').toLowerCase() === 'verified agent';
        const isClosed = p.isClosed === true; 

        // Explicitly forces opacity and transform values inline to bypass legacy stylesheet classes cleanly
        return `
            <div class="property-card" id="card-${p._id}" data-property="${encodeURIComponent(JSON.stringify(p))}" style="opacity: 1 !important; transform: none !important; visibility: visible !important;">
                <div class="card-image">
                    <!-- Apply visual transparency filter when a property is closed -->
                    <img src="${imgSrc}" alt="${p.type || 'Property'}" loading="lazy" style="${isClosed ? 'filter: grayscale(80%) opacity(0.65);' : ''}">
                    <span class="card-type-badge">${p.type || 'Property'}${p.title ? ', ' + p.title : ''}</span>
                    ${p.category ? `<span class="card-category-badge ${p.category}">${p.category === 'shortlet' ? 'Short-let' : p.category === 'rent' ? 'For Rent' : 'For Sale'}</span>` : ''}
                    ${isVerified ? `<span class="card-verified-badge"><i class="fa-solid fa-circle-check"></i></span>` : ''}
                    <!-- Inject "Property Taken" visual badge when closed -->
                    ${isClosed ? `<span class="card-taken-badge">Property Taken</span>` : ''}

                    <div class="card-menu-wrap">
                        <button class="card-menu-btn" onclick="toggleCardMenu('${p._id}')">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="card-menu" id="menu-${p._id}">
                            <button onclick="deleteProperty('${p._id}')"><i class="fas fa-trash"></i> Delete</button>
                            <button onclick="shareProperty('${p._id}')"><i class="fas fa-share-alt"></i> Share</button>
                            <button onclick="editPost('${p._id}')"><i class="fa-solid fa-gear"></i> Edit post</button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-price" style="${isClosed ? 'color: #718096; text-decoration: line-through;' : ''}">₦${price}</div>
                    <div class="card-location"><i class="fas fa-map-marker-alt"></i> ${p.location || 'N/A'}</div>
                    <div class="card-stats">
                        ${isLand ? '' : `<span class="card-stat"><i class="fas fa-bed"></i> ${p.beds || 0} Beds</span>`}
                        ${isLand ? '' : `<span class="card-stat"><i class="fas fa-bath"></i> ${p.baths || 0} Baths</span>`}
                        ${isLand ? `<span class="card-stat"><i class="fas fa-ruler-combined"></i> ${p.area || 0}</span>` : ''}
                    </div>
                    <div class="card-date"><i class="fas fa-calendar-alt"></i> Listed ${date} | <i class="fas fa-eye"></i> ${p.view || 0} views</div>
                </div>
                <div class="card-footer" style="display: flex; gap: 8px;">
                    <a href="/property?id=${p._id}" class="btn-view-details" style="flex: 1.2;">
                        View Details <i class="fas fa-arrow-right"></i>
                    </a>
                    <!-- Flex aligned dynamic action trigger button -->
                    ${isClosed
                        ? `<button class="btn-deal-close closed" onclick="toggleDeal('${p._id}', false)" style="flex: 1;" title="Reopen listing to public">
                             <i class="fa-solid fa-rotate-left"></i> Reopen
                           </button>`
                        : `<button class="btn-deal-close" onclick="toggleDeal('${p._id}', true)" style="flex: 1;" title="Mark property as closed/taken">
                             <i class="fa-solid fa-handshake"></i> Deal Close
                           </button>`
                    }
                </div>
            </div>
        `;
    }

    //total views
    async function loadTotalViews() {
        const res  = await fetch('/api/agent/views');
        const data = await res.json();
        if (data.success) {
            document.getElementById('total-views').innerHTML = `Views <i class="fas fa-eye"></i> <span>${data.totalViews}</span>`;
        }
    }

    // Bio
    const bioText     = document.getElementById('bioText');
    const bioEditForm = document.getElementById('bioEditForm');
    const bioInput    = document.getElementById('bioInput');
    const bioCharCount = document.getElementById('bioCharCount');

    // char counter
    bioInput.addEventListener('input', () => {
        bioCharCount.textContent = bioInput.value.length;
    });

    async function Bio() {
        try {
            const res  = await fetch('/api/get/bio');
            const data = await res.json();
            if (data.success) {
                bioText.textContent = data.bio || 'No bio added yet.';
                bioText.classList.toggle('empty', !data.bio);
            }
        } catch (error) {
            console.error(error);
            bioText.textContent = 'No bio added yet.';
        }
    }

    window.toggleBioEdit = function () {
        const open = bioEditForm.style.display !== 'none';
        bioEditForm.style.display = open ? 'none' : 'block';
        if (!open) {
            bioInput.value = bioText.textContent === 'No bio added yet.' ? '' : bioText.textContent;
            bioCharCount.textContent = bioInput.value.length;
            bioInput.focus();
        }
    };

    window.cancelBioEdit = function () {
        bioEditForm.style.display = 'none';
        bioInput.value = '';
        bioCharCount.textContent = '0';
    };

    window.saveBio = async function () {
        const bioSpinner = document.getElementById('bioSpinner');
        const bio = bioInput.value.trim();
        bioSpinner.style.display = 'inline-block';
        try {
            const res  = await fetch('/api/update/bio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bio })
            });
            const data = await res.json();
            if (data.success) {
                bioText.textContent = data.bio || 'No bio added yet.';
                bioText.classList.toggle('empty', !data.bio);
                cancelBioEdit();
                alertBox.success('Saved', 'Bio updated successfully');
            } else {
                alertBox.error('Error', data.message || 'Failed to save bio');
            }
        } catch (error) {
            console.error(error);
            alertBox.error('Error', 'Something went wrong. Please try again.');
        } finally {
            bioSpinner.style.display = 'none';
        }
    };

// ── Edit Property ─────────────────────────────────────
    const editTypeSelect  = document.getElementById('editTypeSelect');
    const editGroupBeds   = document.getElementById('editGroupBeds');
    const editGroupBaths  = document.getElementById('editGroupBaths');
    const editGroupLand   = document.getElementById('editGroupLand');
    const editForm        = document.getElementById('editPropertyForm');
    const editPreview     = document.getElementById('editImagePreviewContainer');
    let editSelectedFeatures = new Set();
    let currentEditId     = null;

    function handleEditTypeChange() {
        const isLand = editTypeSelect.value === 'land';
        editGroupBeds.style.display  = isLand ? 'none' : '';
        editGroupBaths.style.display = isLand ? 'none' : '';
        editGroupLand.style.display  = isLand ? '' : 'none';
        if (isLand) {
            document.getElementById('editBeds').value  = '';
            document.getElementById('editBaths').value = '';
        }
    }

    editTypeSelect.addEventListener('change', handleEditTypeChange);

    // Live price formatter — shows commas while typing, strips them before submit
    const editPriceInput = document.getElementById('editPrice');
    if (editPriceInput) {
        editPriceInput.addEventListener('input', function () {
            const raw = this.value.replace(/[^0-9]/g, '');
            // Reformat with commas
            this.value = raw ? Number(raw).toLocaleString('en-NG') : '';
            // Move cursor to end
            const len = this.value.length;
            this.setSelectionRange(len, len);
        });
    }

    function initEditFeatures(existing) {
        const list = Array.isArray(existing)
            ? existing
            : (existing ? existing.split(',').map(f => f.trim()).filter(Boolean) : []);
        editSelectedFeatures = new Set(list);
        const container = document.getElementById('editFeaturesContainer');
        container.innerHTML = '';
        availableFeatures.forEach(feature => {
            const tag = document.createElement('div');
            tag.className = 'feature-tag' + (editSelectedFeatures.has(feature) ? ' selected' : '');
            tag.textContent = feature;
            tag.onclick = () => {
                if (editSelectedFeatures.has(feature)) {
                    editSelectedFeatures.delete(feature);
                    tag.classList.remove('selected');
                } else {
                    editSelectedFeatures.add(feature);
                    tag.classList.add('selected');
                }
                document.getElementById('editFeaturesInput').value = Array.from(editSelectedFeatures).join(',');
            };
            container.appendChild(tag);
        });
        document.getElementById('editFeaturesInput').value = Array.from(editSelectedFeatures).join(',');
    }

    function updateEditPreview() {
        editPreview.innerHTML = '';

        // existing images
        existingImages.forEach((name, index) => {
            const item = document.createElement('div');
            item.className = 'preview-item';
            item.innerHTML = `
                <img src="/agent-loged/upload-property/${name}" alt="Current image">
                <button type="button" class="remove-preview" onclick="removeExistingImage(${index})">×</button>
            `;
            editPreview.appendChild(item);
        });

        // new images
        editImages.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const item = document.createElement('div');
                item.className = 'preview-item';
                item.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button type="button" class="remove-preview" onclick="removeEditImage(${index})">×</button>
                `;
                editPreview.appendChild(item);
            };
            reader.readAsDataURL(file);
        });
    }

    window.removeEditImage = function(index) {
        editImages.splice(index, 1);
        updateEditPreview();
    };

    window.removeExistingImage = function(index) {
        existingImages.splice(index, 1);
        updateEditPreview();
    };

    window.editPost = async function(id) {
        currentEditId = id;
        editImages = [];
        existingImages = [];
        updateEditPreview();
        let pendingEditSubmitCallback = null;

        try {
            const card = document.getElementById(`card-${id}`);
            const p    = JSON.parse(decodeURIComponent(card.dataset.property));

            // Support both potential collection schema array field structures
            existingImages = Array.isArray(p.imageNames) ? [...p.imageNames] : (Array.isArray(p.imageName) ? [...p.imageName] : []);

            // Open editing modal directly when edit button is clicked without interruption
            populateFormAndOpenModal(p);

        } catch (err) {
            alertBox.error('Error', err.message || 'Failed to open editor. Please try again.');
        }
    };

    // Helper subroutine to populate input fields and open the overlay interface safely
    function populateFormAndOpenModal(p) {
        document.getElementById('editTitle').value       = p.title       || '';
        // Show price formatted with commas for readability (e.g. 1,000,000)
        document.getElementById('editPrice').value       = p.price ? Number(p.price).toLocaleString('en-NG') : '';
        document.getElementById('editLocation').value    = p.location    || '';
        document.getElementById('editBeds').value        = p.beds        || '';
        document.getElementById('editBaths').value       = p.baths       || '';
        document.getElementById('editArea').value        = p.area        || '';
        document.getElementById('editDescription').value = p.description || '';
        
        // Populate hidden layout map input fields if they exist in your edit form schema
        if (document.getElementById('editLat')) document.getElementById('editLat').value = p.lat || '';
        if (document.getElementById('editLng')) document.getElementById('editLng').value = p.lng || '';
        
        editTypeSelect.value = (p.type || 'house').toLowerCase();
        handleEditTypeChange();
        initEditFeatures(p.features);
        updateEditPreview();

        document.getElementById('editModalOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    window.closeEditModal = function() {
        document.getElementById('editModalOverlay').classList.remove('active');
        document.body.style.overflow = 'auto';
        currentEditId  = null;
        editImages     = [];
        existingImages = [];
    };

    window.submitEdit = async function() {
        const btn     = document.getElementById('editSubmitBtn');
        const spinner = btn.querySelector('.spinner');
        const btnText = btn.querySelector('.btn-text');

        if (editImages.length === 0 && existingImages.length === 0) { 
            alertBox.warning('No Images', 'Please keep or upload at least one image'); 
            return; 
        }

        // [Validation logic remains exactly as you had it]
        const emojiOrSymbol = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FEFF}!@#$%^&*()+=\[\]{}<>?\\|`~]/u;
        const textOnly      = /^[a-zA-Z0-9\s,.\-'"\/()]+$/;
        const numbersOnly   = /^\d+(\.\d+)?$/;

        const title    = document.getElementById('editTitle').value.trim();
        const price    = document.getElementById('editPrice').value.trim().replace(/[^0-9]/g, '');
        const category = document.getElementById('editCategory').value;
        const location = document.getElementById('editLocation').value.trim();
        const beds     = document.getElementById('editBeds').value.trim();
        const baths    = document.getElementById('editBaths').value.trim();
        const area     = document.getElementById('editArea').value.trim();
        const desc     = document.getElementById('editDescription').value.trim();

        if (!title)                                                { alertBox.warning('Missing Field', 'Property title is required'); return; }
        if (emojiOrSymbol.test(title) || !textOnly.test(title)) { alertBox.error('Invalid Title', 'Title must not contain emojis or special symbols'); return; }
        if (!price)                                                { alertBox.warning('Missing Field', 'Price is required'); return; }
        if (!numbersOnly.test(price))                            { alertBox.error('Invalid Price', 'Price must be numbers only'); return; }
        if (!category)                                            { alertBox.warning('Missing Field', 'Please select a listing category'); return; }
        if (!location)                                            { alertBox.warning('Missing Field', 'Location is required'); return; }
        if (emojiOrSymbol.test(location) || !textOnly.test(location)) { alertBox.error('Invalid Location', 'Location must not contain emojis or special symbols'); return; }
        if (beds  && !numbersOnly.test(beds))                    { alertBox.error('Invalid Bedrooms', 'Bedrooms must be a number only'); return; }
        if (baths && !numbersOnly.test(baths))                   { alertBox.error('Invalid Bathrooms', 'Bathrooms must be a number only'); return; }
        if (area  && emojiOrSymbol.test(area))                    { alertBox.error('Invalid Area', 'Area must not contain emojis or special symbols'); return; }
        if (desc  && emojiOrSymbol.test(desc))                   { alertBox.error('Invalid Description', 'Description must not contain emojis or special symbols'); return; }

        // ── MAP AREA SUBMIT VALIDATION CHECK ──
        const editLatEl = document.getElementById('editLat');
        const editLngEl = document.getElementById('editLng');
        const latVal = editLatEl ? parseFloat(editLatEl.value) : 0;
        const lngVal = editLngEl ? parseFloat(editLngEl.value) : 0;
        const locationIsOnMap = !isNaN(latVal) && !isNaN(lngVal) && latVal !== 0 && lngVal !== 0;

        if (!locationIsOnMap) {
            alertBox.warning('Map Confirmation Required', 'Please confirm this property location on the map.');
            
            document.getElementById('editModalOverlay').classList.remove('active');
            document.body.style.overflow = 'auto';

            // Store the callback globally instead of passing it as an argument
            pendingEditSubmitCallback = (confirmedCoords) => {
                if (editLatEl) editLatEl.value = confirmedCoords.lat;
                if (editLngEl) editLngEl.value = confirmedCoords.lng;
                
                document.getElementById('editModalOverlay').classList.add('active');
                document.body.style.overflow = 'hidden';
                
                // Clear the global before calling
                pendingEditSubmitCallback = null;
                window.submitEdit();
            };

            // Open picker with NO argument (to prevent stringification)
            window.openMapPicker(); 
            return;
        }

        // [Proceed with FormData and submission...]
        const formData = new FormData(editForm);
        existingImages.forEach(image => formData.append('keepImages', image));
        editImages.forEach(file => formData.append('file', file));

        btn.disabled          = true;
        spinner.style.display = 'inline-block';
        btnText.style.display = 'inline';
        btnText.textContent = 'Loading ...'

        try {
            const res  = await fetch(`/api/edit/post/${currentEditId}`, { 
                method: 'PATCH', 
                body: formData 
            });
            const data = await res.json();

            if (res.ok && data.success) {
                alertBox.success('Updated', 'Property listing updated successfully!', () => {
                    closeEditModal();
                    loadProperties(true);
                });
            } else {
                alertBox.error('Failed', data.message || 'Failed to update property');
            }
        } catch (err) {
            alertBox.error('Error', 'Something went wrong while saving changes.');
        } finally {
            btn.disabled          = false;
            spinner.style.display = 'none';
            btnText.style.display = 'inline';
        }
    };

    // ── Map Picker ────────────────────────────────────────
    let mapPickerInstance = null;
    let mapPickerMarker   = null;
    let mapPickerLat      = null;
    let mapPickerLng      = null;
    let mapPickerCallback = null; // called with { lat, lng } when confirmed

    window.openMapPicker = function(locationText, onConfirm) {
        mapPickerCallback = onConfirm;
        document.getElementById('mapPickerCoords').textContent = 'Click or drag pin to set location';
        document.getElementById('mapSearchInput').value = locationText || '';
        document.getElementById('mapSearchResults').innerHTML = '';
        document.getElementById('mapPickerOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';

        // Initialize map centered on Enugu, Nigeria
        setTimeout(() => {
            if (!mapPickerInstance) {
                mapPickerInstance = L.map('mapPickerContainer').setView([6.4584, 7.5464], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(mapPickerInstance);

                mapPickerInstance.on('click', (e) => {
                    placeMapPin(e.latlng.lat, e.latlng.lng);
                });
            } else {
                mapPickerInstance.invalidateSize();
            }

            // Auto-search the location text to center the map
            if (locationText) searchMapLocation(locationText);
        }, 100);
    };

window.closeMapPicker = function () {

    document
        .getElementById('mapPickerOverlay')
        .classList.remove('active');

    document.body.style.overflow = 'auto';

    console.log('🧹 Resetting Map Picker State');

    mapPickerLat = null;
    mapPickerLng = null;

    if (mapPickerMarker) {
        mapPickerInstance.removeLayer(mapPickerMarker);
        mapPickerMarker = null;
    }
};

    function placeMapPin(lat, lng) {
        mapPickerLat = lat;
        mapPickerLng = lng;

        if (mapPickerMarker) {
            mapPickerMarker.setLatLng([lat, lng]);
        } else {
            mapPickerMarker = L.marker([lat, lng], { draggable: true }).addTo(mapPickerInstance);
            mapPickerMarker.on('dragend', (e) => {
                const pos = e.target.getLatLng();
                placeMapPin(pos.lat, pos.lng);
            });
        }

        document.getElementById('mapPickerCoords').innerHTML =
            `<i class="fa-solid fa-location-dot"></i> ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }

    window.searchMapLocation = async function(query) {
        const input = query || document.getElementById('mapSearchInput').value.trim();
        if (!input) return;

        const resultsEl = document.getElementById('mapSearchResults');
        resultsEl.innerHTML = '<p style="font-size:0.8rem;color:#888;padding:4px;">Searching...</p>';

        try {
            const res  = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input + ', Enugu, Nigeria')}&limit=5`,
                { headers: { 'User-Agent': 'EasyFind-Property-Marketplace' } }
            );
            const data = await res.json();

            if (!data.length) {
                resultsEl.innerHTML = '<p style="font-size:0.8rem;color:#e55;padding:4px;">No results found. Try a nearby landmark.</p>';
                return;
            }

            resultsEl.innerHTML = data.map((r, i) => `
                <div onclick="selectMapResult(${r.lat}, ${r.lon}, '${r.display_name.replace(/'/g, '').slice(0, 60)}')"
                     style="padding:7px 10px;cursor:pointer;font-size:0.82rem;border-bottom:1px solid #eee;hover:background:#f0fdfb;">
                    <i class="fas fa-map-marker-alt" style="color:#0d7068;margin-right:6px;"></i>${r.display_name.slice(0, 70)}
                </div>
            `).join('');

            // Auto-center on first result
            mapPickerInstance.setView([parseFloat(data[0].lat), parseFloat(data[0].lon)], 15);
            placeMapPin(parseFloat(data[0].lat), parseFloat(data[0].lon));
        } catch (err) {
            resultsEl.innerHTML = '<p style="font-size:0.8rem;color:#e55;padding:4px;">Search failed. Check your connection.</p>';
        }
    };

window.selectMapResult = function(lat, lon, name) {
    // 1. Update the visual map position
    mapPickerInstance.setView([lat, lon], 16);
    placeMapPin(lat, lon);
    
    // 2. IMPORTANT: Fill the hidden inputs so submitProperty passes its check
    const latInput = document.getElementById('propLatitude') || document.querySelector('[name="latitude"]');
    const lngInput = document.getElementById('propLongitude') || document.querySelector('[name="longitude"]');
    
    if (latInput) latInput.value = lat;
    if (lngInput) lngInput.value = lon;

    // 3. UI Cleanup
    document.getElementById('mapSearchResults').innerHTML = '';
    document.getElementById('mapSearchInput').value = name;
};

window.confirmMapLocation = function () {

    if (
        mapPickerLat === null ||
        mapPickerLng === null
    ) {
        alertBox.warning(
            'Location Missing',
            'Please place a pin on the map first.'
        );
        return;
    }

    console.log('📍 Confirmed Coordinates:', {
        lat: mapPickerLat,
        lng: mapPickerLng
    });

    const propLat =
        document.getElementById('propLatitude');

    const propLng =
        document.getElementById('propLongitude');

    if (propLat) propLat.value = mapPickerLat;
    if (propLng) propLng.value = mapPickerLng;

    const editLat =
        document.getElementById('editLat');

    const editLng =
        document.getElementById('editLng');

    if (editLat) editLat.value = mapPickerLat;
    if (editLng) editLng.value = mapPickerLng;

    if (typeof pendingEditSubmitCallback === 'function') {

        pendingEditSubmitCallback({
            lat: mapPickerLat,
            lng: mapPickerLng
        });

        pendingEditSubmitCallback = null;
    }

    if (typeof mapPickerCallback === 'function') {

        mapPickerCallback({
            lat: mapPickerLat,
            lng: mapPickerLng
        });
    }

    closeMapPicker();
};

    // Enter key on map search
    document.getElementById('mapSearchInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); searchMapLocation(); }
    });

    // ── Document Initialization Callbacks ───────────────────
    async function initializeDashboard() {
        const authenticated = await checkAuth();
        if (authenticated) {
            loadProperties(isNewLoad = true);
            loadTotalViews();
            Bio();
        }
    }

    initializeDashboard();

    // ── Profile Sharing Controls ──────────────────────────
    window.copyProfileLink = async function () {
        // Ensure the agent ID was captured during checkAuth
        if (!currentAgentId) {
            alertBox.warning('Profile Loading', 'Profile details are still loading. Please wait a moment.');
            return;
        }

        const url = `${window.location.origin}/agent-profile/?id=${currentAgentId}`;

        // 1. Try Native System Share (WhatsApp, Instagram, etc.)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Check out my property portfolio',
                    text: 'View my verified listings on EasyFind.',
                    url: url
                });
                return; // Exit if share was successful
            } catch (err) {
                // If user cancels share or error occurs, fall back to copy to clipboard
                console.log('Native share failed or cancelled, falling back to copy.');
            }
        }

        // 2. Clipboard Fallback (For Desktop or unsupported browsers)
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url)
                .then(() => showTooltipAndAlert(url))
                .catch(() => fallbackCopyProfile(url));
        } else {
            fallbackCopyProfile(url);
        }
    };

    // Helper to show the visual "Link Copied" feedback
    function showTooltipAndAlert(url) {
        const tooltip = document.getElementById('shareTooltip');
        if (tooltip) {
            tooltip.style.opacity = '1';
            tooltip.style.visibility = 'visible';
            setTimeout(() => {
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
            }, 2000);
        }
        alertBox.success('Link Copied', 'Your portfolio link has been copied to the clipboard.');
    }

    function fallbackCopyProfile(url) {
        const el = document.createElement('textarea');
        el.value = url;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        try {
            document.execCommand('copy');
            showTooltipAndAlert(url);
        } catch (err) {
            alertBox.error('Copy Failed', 'Please copy the URL manually: ' + url);
        }
        document.body.removeChild(el);
    }
});

// ── BRAND NEW: AI Gemini Real Estate Description Generator Executor ──
window.generateAIDescription = async function(mode) {
    const isEdit = mode === 'edit';
    const btn = document.getElementById(isEdit ? 'btnAiEdit' : 'btnAiPost');
    const textarea = document.getElementById(isEdit ? 'editDescription' : 'postDescription');
    
    // Select correct form layout block
    const form = isEdit ? document.getElementById('editPropertyForm') : (document.getElementById('uploadPropertyForm') || document.getElementById('propertyForm'));
    if (!form) {
        alertBox.error('Form Error', 'Form element context was not found.');
        return;
    }

    // Capture property input values for contextual description mapping
    const title = form.querySelector('[name="title"]')?.value.trim();
    const type = form.querySelector('[name="type"]')?.value;
    const category = form.querySelector('[name="category"]')?.value;
    const price = form.querySelector('[name="price"]')?.value.trim().replace(/[^0-9]/g, '');
    const location = form.querySelector('[name="location"]')?.value.trim();
    const beds = form.querySelector('[name="beds"]')?.value.trim();
    const baths = form.querySelector('[name="baths"]')?.value.trim();
    const area = form.querySelector('[name="area"]')?.value.trim();
    const featuresInput = isEdit ? (document.getElementById('editFeaturesInput')?.value || "") : (document.getElementById('featuresInput')?.value || "");

    // Require essential landmark parameters to prevent shallow description generation
    if (!title || !price || !location) {
        alertBox.warning('Form Incomplete', 'Please fill in Title, Price, and Location landmarks to write a contextual description.');
        return;
    }

    // Toggle CSS Spinner Loading State
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner spin-icon"></i> Generating...`;

    try {
        const response = await fetch('/api/ai/generate-description', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title, type, category, price, location, beds, baths, area, features: featuresInput
            })
        });
        const data = await response.json();
        
        if (data.success) {
            textarea.value = data.description;
            alertBox.success('AI Success', 'Description compiled successfully!');
        } else {
            alertBox.error('AI Error', data.message || 'Could not compile description write-up.');
        }
    } catch (err) {
        console.error("AI Description compiling failed:", err);
        alertBox.error('Network Error', 'Failed to communicate with description endpoint.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
};

// Dynamic Notifications Initialization and click redirection system
    let mockNotifications = [];

    async function initializeNotifications(isVerified, isBoosted) {
        // System onboarding suggestions (remains static)
        const systemNotifications = [
            { 
                id: "system-boost", 
                type: "updates", 
                message: isBoosted 
                    ? "Your account or listing has been boosted! 🚀 Making sales faster with premium reach." 
                    : "Boost your profile or per one property to make your sale faster! 🚀", 
                unread: !isBoosted,
                url: isBoosted ? null : "/boost-account",
                isDynamic: false
            },
            { 
                id: "system-verify", 
                type: "alerts", 
                message: isVerified 
                    ? "your account has been verified you can now post unlimited property and make sale faster with trust." 
                    : "Action Required: Please verify your account to list properties worth above ₦1M.", 
                unread: !isVerified,
                url: isVerified ? null : "/agent-verification",
                isDynamic: false
            },
            { 
                id: "system-welcome", 
                type: "updates", 
                message: "Welcome to Easyfind! Start listing your vacant property for free.", 
                unread: false,
                url: null,
                isDynamic: false
            }
        ];

        try {
            // Retrieve actual comment notifications from the database
            const res = await fetch('/api/agent/notifications', { credentials: 'include' });
            const data = await res.json();
            
            let dbNotifications = [];
            if (data.success && data.notifications) {
                dbNotifications = data.notifications.map(n => ({
                    id: n._id,
                    type: n.type || "alerts",
                    message: n.message,
                    unread: n.unread,
                    url: `/property?id=${n.propertyId}`,
                    isDynamic: true // Flag to handle database deletion on click
                }));
            }

            // Combine comment alerts with onboarding system notifications
            mockNotifications = [...dbNotifications, ...systemNotifications];
        } catch (err) {
            console.error("Failed to load real-time database notifications:", err);
            mockNotifications = systemNotifications;
        } finally {
            updateBadgeCount();
            renderNotifications();
        }
    }

    // Document Object Selectors
    const notiTrigger = document.getElementById('notiTrigger');
    const notiPanel = document.getElementById('notiPanel');
    const closePanel = document.getElementById('closePanel');
    const notiOverlay = document.getElementById('notiOverlay');
    const notiBody = document.getElementById('notiBody');
    const notiBadge = document.getElementById('notiBadge');
    const tabBtns = document.querySelectorAll('.tab-btn');

    let activeTab = "all";

    // Open / Close Sliding Panel Controls
    function togglePanel() {
        notiPanel.classList.toggle('open');
        notiOverlay.classList.toggle('active');
    }

    if (notiTrigger) notiTrigger.addEventListener('click', togglePanel);
    if (closePanel) closePanel.addEventListener('click', togglePanel);
    if (notiOverlay) notiOverlay.addEventListener('click', togglePanel);

    // Helper Engine function to handle adding/removing shaking classes cleanly
    function triggerBellShake() {
        if (notiTrigger) {
            notiTrigger.classList.add('shake');
            setTimeout(() => {
                notiTrigger.classList.remove('shake');
            }, 600);
        }
    }

    // Dynamic Badge Counter Updater
    function updateBadgeCount() {
        if (!notiBadge || !notiTrigger) return;
        const unreadCount = mockNotifications.filter(n => n.unread).length;
        if(unreadCount > 0) {
            notiBadge.textContent = unreadCount;
            notiBadge.style.display = "block";
            triggerBellShake();
        } else {
            notiBadge.style.display = "none";
            notiTrigger.classList.remove('shake');
        }
    }

    // Layout Dynamic Feed Renderer with Staggered Cascading Animation Delay
    function renderNotifications() {
        if (!notiBody) return;
        notiBody.innerHTML = "";
        
        const filtered = mockNotifications.filter(item => activeTab === "all" || item.type === activeTab);
        
        if(filtered.length === 0) {
            notiBody.innerHTML = `<div style="text-align:center; color:#718096; margin-top:40px; font-size:0.9rem;">No notifications found</div>`;
            return;
        }

        filtered.forEach((noti, index) => {
            const card = document.createElement('div');
            card.className = `noti-item ${noti.unread ? 'unread' : ''}`;
            card.setAttribute('data-type', noti.type);
            card.setAttribute('data-id', noti.id);
            card.style.animationDelay = `${index * 0.06}s`;

            const icon = noti.type === 'alerts' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-info';

            card.innerHTML = `
                <div class="noti-icon-wrapper">
                    <i class="${icon}"></i>
                </div>
                <div class="noti-content">
                    <p>${noti.message}</p>                
                </div>
            `;

            // Handle Card Click (Mark as Read, auto-delete comments, and redirect)
            card.addEventListener('click', async function(e) {
                createRippleEffect(e, card);
                
                if (noti.isDynamic) {
                    // Update layout values locally
                    if(noti.unread) {
                        noti.unread = false;
                        card.classList.remove('unread');
                        updateBadgeCount();
                    }

                    // Delete notification from the DB
                    try {
                        await fetch(`/api/agent/notifications/${noti.id}`, { 
                            method: 'DELETE',
                            credentials: 'include'
                        });
                    } catch (err) {
                        console.error("Failed to delete notification on redirect:", err);
                    }

                    // Redirect to property
                    if (noti.url) {
                        setTimeout(() => {
                            window.location.href = noti.url;
                        }, 350);
                    }
                } else {
                    // For static onboarding triggers
                    if(noti.unread) {
                        setTimeout(() => {
                            noti.unread = false;
                            card.classList.remove('unread');
                            updateBadgeCount();
                        }, 300);
                    }

                    if (noti.url) {
                        setTimeout(() => {
                            window.location.href = noti.url;
                        }, 400);
                    }
                }
            });

            notiBody.appendChild(card);
        });
    }

    // Advanced Custom Vector Ripple Generator Function
    function createRippleEffect(e, element) {
        const ripple = document.createElement('span');
        ripple.classList.add('noti-ripple');
        
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.transform = "translate(-50%, -50%)";

        element.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    }

    // Horizontal Sub-Tab Switching Controls
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeTab = btn.getAttribute('data-tab');
            renderNotifications();
        });
    });

    // AUTOMATION HOOK: Loop animation every 5 seconds if unread cards sit in panel while hidden
    setInterval(() => {
        const unreadCount = mockNotifications.filter(n => n.unread).length;
        if (unreadCount > 0 && notiPanel && !notiPanel.classList.contains('open')) {
            triggerBellShake();
        }
    }, 5000);
