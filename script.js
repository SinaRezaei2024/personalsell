document.addEventListener('DOMContentLoaded', () => {
    AOS.init({ duration: 800, once: true });

    let cart = JSON.parse(localStorage.getItem('cartItems')) || {};
    let totalPrice = 0;
    let filters = { subject: 'all', grade: 'all' };

    function formatPrice(price) {
        return price.toLocaleString('fa-IR') + ' تومان';
    }

    function updateCartIcon() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
            cartCount.textContent = totalItems;
        }
    }

    function showMessage(elementId, message, type) {
        const messageContainer = document.createElement('div');
        messageContainer.className = `message ${type}`;
        messageContainer.textContent = message;

        const targetElement = elementId === 'bookModal'
            ? document.querySelector('#bookModal .modal-details')
            : document.getElementById('totalPrice').parentElement;

        if (targetElement) {
            const existingMessage = targetElement.querySelector('.message');
            if (existingMessage) existingMessage.remove();
            targetElement.appendChild(messageContainer);
            setTimeout(() => messageContainer.remove(), 1500);
        }
    }

    function updateCartModal() {
        const cartItems = document.getElementById('cartItems');
        const totalPriceEl = document.getElementById('totalPrice');
        const userInfoForm = document.getElementById('userInfoForm');
        cartItems.innerHTML = '';
        totalPrice = 0;
        let hasItems = false;

        for (const id in cart) {
            if (cart[id] > 0) {
                hasItems = true;
                const item = document.querySelector(`.book-card .btn[data-details*='"id":"${id}"']`);
                if (item) {
                    const details = JSON.parse(item.dataset.details);
                    totalPrice += details.price * cart[id];
                    const itemElement = document.createElement('div');
                    itemElement.className = 'cart-item';
                    itemElement.innerHTML = `
                        <div class="cart-item-controls">
                            <button class="quantity-btn decrease" data-id="${id}">-</button>
                            <span>${cart[id]}</span>
                            <button class="quantity-btn increase" data-id="${id}">+</button>
                        </div>
                        <div class="cart-item-info">
                            <div class="cart-item-title">${details.title}</div>
                            <div class="cart-item-desc">${details.print}</div>
                            <div class="cart-item-price">${formatPrice(details.price * cart[id])}</div>
                        </div>
                        <img src="${details.image}" alt="${details.title}" class="cart-item-image">
                    `;
                    cartItems.appendChild(itemElement);
                }
            }
        }

        if (!hasItems) {
            cartItems.innerHTML = '<p>سبد خرید خالی است.</p>';
            userInfoForm.style.display = 'none';
        } else {
            userInfoForm.style.display = 'block';
        }

        totalPriceEl.textContent = formatPrice(totalPrice);
    }

    function saveCart() {
        localStorage.setItem('cartItems', JSON.stringify(cart));
    }

    function redirectToZarinLink(userName, userPhone, totalAmount) {
        const zarinLinkBase = 'https://zarinp.al/educational_platform';
        const description = `پرداخت سفارش - نام: ${userName}, شماره: ${userPhone}, مبلغ: ${totalAmount} تومان`;
        const finalLink = `${zarinLinkBase}?amount=${totalAmount * 10}&description=${encodeURIComponent(description)}`;
        window.location.href = finalLink;
    }

    function validateName(name) {
        return /^[\u0600-\u06FF\s]+$/.test(name.trim());
    }

    function validatePhone(phone) {
        return /^0[0-9]{10}$/.test(phone.trim());
    }

    function applyFilters() {
        const teacherSections = document.querySelectorAll('.teacher-section');
        const bookCards = document.querySelectorAll('.book-card');
        let singleBook = null;
        let visibleBooks = 0;

        bookCards.forEach(card => {
            const subject = card.dataset.subject;
            const grade = card.dataset.grade;

            const subjectMatch = filters.subject === 'all' || filters.subject === subject;
            const gradeMatch = filters.grade === 'all' || filters.grade === grade;

            if (subjectMatch && gradeMatch) {
                visibleBooks++;
                singleBook = card;
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });

        bookCards.forEach(card => {
            card.classList.remove('single');
            if (visibleBooks === 1 && card === singleBook) {
                card.classList.add('single');
            }
        });

        teacherSections.forEach(section => {
            const subject = section.dataset.subject;
            section.style.display = (filters.subject === 'all' || filters.subject === subject) ? 'block' : 'none';
        });
    }

    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            const filterType = button.dataset.filter;
            const filterValue = button.dataset.value;

            filters[filterType] = filterValue;

            document.querySelectorAll(`.filter-btn[data-filter="${filterType}"]`).forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            applyFilters();
        });
    });

    const bookModal = document.getElementById('bookModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalPages = document.getElementById('modalPages');
    const modalPrint = document.getElementById('modalPrint');
    const modalDesc = document.getElementById('modalDesc');
    const addToCartBtn = document.querySelector('#bookModal .add-to-cart');

    document.querySelectorAll('.book-card .btn').forEach(button => {
        button.addEventListener('click', () => {
            const details = JSON.parse(button.dataset.details);
            modalImage.src = details.image;
            modalImage.alt = details.title;
            modalTitle.textContent = details.title;
            modalPrice.textContent = formatPrice(details.price);
            modalPages.textContent = details.pages;
            modalPrint.textContent = details.print;
            modalDesc.textContent = details.desc;
            addToCartBtn.dataset.id = details.id;
            bookModal.style.display = 'flex';
        });
    });

    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            const id = addToCartBtn.dataset.id;
            if (cart[id] >= 10) {
                showMessage('bookModal', 'حداکثر 10 عدد از هر کتاب قابل سفارش است!', 'error');
                return;
            }
            cart[id] = (cart[id] || 0) + 1;
            saveCart();
            updateCartIcon();
            showMessage('bookModal', 'به سبد خرید اضافه شد.', 'success');
        });
    }

    document.querySelector('#bookModal .close').addEventListener('click', () => {
        bookModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === bookModal) {
            bookModal.style.display = 'none';
        }
    });

    const cartModal = document.getElementById('cartModal');
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            updateCartModal();
            cartModal.style.display = 'flex';
        });
    }

    const cartClose = document.querySelector('#cartModal .cart-close');
    if (cartClose) {
        cartClose.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            cartModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            cartModal.style.display = 'none';
        }
    });

    const cartItemsContainer = document.getElementById('cartItems');
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('quantity-btn')) {
                e.preventDefault();
                const id = target.dataset.id;
                if (target.classList.contains('increase')) {
                    if (cart[id] >= 10) {
                        showMessage('cartModal', 'حداکثر 10 عدد از هر کتاب قابل سفارش است.', 'error');
                        return;
                    }
                    cart[id]++;
                } else if (target.classList.contains('decrease')) {
                    cart[id]--;
                    if (cart[id] <= 0) delete cart[id];
                }
                saveCart();
                updateCartIcon();
                updateCartModal();
            }
        });
    }

    const checkoutBtn = document.querySelector('.checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (Object.keys(cart).length === 0) {
                showMessage('cartModal', 'سبد خرید خالی است.', 'error');
                return;
            }

            const userName = document.getElementById('userName').value.trim();
            const userPhone = document.getElementById('userPhone').value.trim();

            if (!validateName(userName)) {
                showMessage('cartModal', 'نام باید فقط شامل حروف فارسی باشد.', 'error');
                return;
            }

            if (!validatePhone(userPhone)) {
                showMessage('cartModal', 'شماره تلفن باید با 0 شروع شده و 11 رقم باشد.', 'error');
                return;
            }

            redirectToZarinLink(userName, userPhone, totalPrice);
            showMessage('cartModal', 'به صفحه پرداخت هدایت می‌شوید...', 'success');
            cart = {};
            saveCart();
            updateCartIcon();
            updateCartModal();
            setTimeout(() => {
                cartModal.style.display = 'none';
                document.getElementById('userName').value = '';
                document.getElementById('userPhone').value = '';
            }, 1500);
        });
    }

    updateCartIcon();
    applyFilters();
});