/* ========================================
   Custom Select Component
   ======================================== */
function initCustomSelects() {
    const customSelects = document.querySelectorAll('.custom-select-wrapper');

    customSelects.forEach(wrapper => {
        const select = wrapper.querySelector('select');
        if (!select || select.style.display === 'none') return; // Skip if already initialized or invalid

        // Hide original select
        select.style.display = 'none';

        // Create Custom UI
        const customSelect = document.createElement('div');
        customSelect.className = 'custom-select';

        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';

        // Initial selected text
        const selectedOption = select.options[select.selectedIndex];
        trigger.innerHTML = `<span>${selectedOption.text}</span><div class="arrow"></div>`;

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'custom-options';

        // Build options
        Array.from(select.options).forEach(option => {
            const customOption = document.createElement('div');
            customOption.className = 'custom-option';
            if (option.selected) customOption.classList.add('selected');
            customOption.dataset.value = option.value;
            customOption.textContent = option.text;

            customOption.addEventListener('click', (e) => {
                e.stopPropagation();
                // Update select value
                select.value = option.value;
                // Trigger change event manually
                select.dispatchEvent(new Event('change'));

                // Update UI
                trigger.querySelector('span').textContent = option.text;
                optionsContainer.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
                customOption.classList.add('selected');
                customSelect.classList.remove('open');
            });

            optionsContainer.appendChild(customOption);
        });

        // Assemble
        customSelect.appendChild(trigger);
        customSelect.appendChild(optionsContainer);
        wrapper.appendChild(customSelect);

        // Toggle Open/Close
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close other selects
            document.querySelectorAll('.custom-select').forEach(s => {
                if (s !== customSelect) s.classList.remove('open');
            });
            customSelect.classList.toggle('open');
        });
    });

    // Close when clicking outside
    window.addEventListener('click', () => {
        document.querySelectorAll('.custom-select').forEach(s => s.classList.remove('open'));
    });
}
