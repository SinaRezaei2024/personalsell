document.addEventListener('DOMContentLoaded', () => {
    // Initialize AOS
    AOS.init({
        duration: 800,
        once: true
    });

    // سبد خرید
    let cart = JSON.parse(localStorage.getItem('cart')) || {};

    // فرمت کردن قیمت به تومان
    function formatPrice(price) {
        return price.toLocaleString('fa-IR') + ' تومان';
    }

    // آپدیت تعداد آیتم‌ها در آیکون سبد
    function updateCartIcon() {
        const cartCount = document.querySelector('.cart-count');
        const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
        cartCount.textContent = totalItems;
    }

    // نمایش پیام در پاپ‌آپ
    function showMessage(elementId, message, type) {
        const messageContainer = document.createElement('div');
        messageContainer.className = `message ${type}`;
        messageContainer.textContent = message;

        let targetElement;
        if (elementId === 'bookModal') {
            targetElement = document.querySelector('#bookModal .modal-details');
        } else if (elementId === 'cartModal') {
            targetElement = document.getElementById('totalPrice').parentElement;
        } else if (elementId === 'contactForm') {
            targetElement = document.getElementById('contactForm');
        }

        const existingMessage = targetElement.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        targetElement.appendChild(messageContainer);
        setTimeout(() => {
            messageContainer.remove();
        }, 1500); // پیام بعد از 1.5 ثانیه محو می‌شه
    }

    // آپدیت پاپ‌آپ سبد خرید
    function updateCartModal() {
        const cartItems = document.getElementById('cartItems');
        const totalPriceEl = document.getElementById('totalPrice');
        const userInfoForm = document.getElementById('userInfoForm');
        cartItems.innerHTML = '';
        let totalPrice = 0;
        let hasItems = false;

        for (const id in cart) {
            if (cart[id] > 0) {
                hasItems = true;
                const item = document.querySelector(`.book-card .btn[data-details*='"id":"${id}"']`).dataset.details;
                const details = JSON.parse(item);
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
                        <div class="cart-item-price">قیمت ${cart[id]} عدد: ${formatPrice(details.price * cart[id])}</div>
                    </div>
                    <img src="${details.image}" alt="${details.title}" class="cart-item-image">
                `;
                cartItems.appendChild(itemElement);
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

    // ذخیره سبد در localStorage
    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    // ایجاد فایل JSON
    function generateJSON(userName, userPhone) {
        try {
            console.log('Generating JSON...');
            console.log('User:', userName, 'Phone:', userPhone, 'Cart:', cart);

            const now = moment();
            const date = now.format('YYYY-MM-DD'); // مثلاً 2025-05-20
            const time = now.format('HH:mm:ss'); // مثلاً 11:19:00

            // جمع‌آوری سفارش‌ها
            let orders = [];
            let totalPrice = 0;

            for (const id in cart) {
                if (cart[id] > 0) {
                    const item = document.querySelector(`.book-card .btn[data-details*='"id":"${id}"']`).dataset.details;
                    const details = JSON.parse(item);
                    const itemTotal = details.price * cart[id];
                    totalPrice += itemTotal;

                    orders.push({
                        "title": details.title, // استفاده از عنوان فارسی
                        "quantity": cart[id],
                        "totalPrice": `${itemTotal.toLocaleString('en-US')} Toman`
                    });
                }
            }

            // ساختار فایل JSON
            const jsonData = {
                "fullName": userName,
                "phoneNumber": userPhone,
                "date": date,
                "time": time,
                "orders": orders,
                "totalAmount": `${totalPrice.toLocaleString('en-US')} Toman`
            };

            // تبدیل به رشته JSON
            const jsonString = JSON.stringify(jsonData, null, 2);

            // ایجاد فایل JSON
            const fileName = `order_${date}_${time.replace(/:/g, '-')}.json`;
            const blob = new Blob([jsonString], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(link.href);

            console.log('JSON generated successfully:', fileName);
        } catch (error) {
            console.error('Error generating JSON:', error);
            showMessage('cartModal', 'خطایی در تولید فایل JSON رخ داد. لطفاً دوباره امتحان کنید.', 'error');
        }
    }

    // اعتبارسنجی نام (فقط حروف فارسی و فاصله)
    function validateName(name) {
        const persianRegex = /^[\u0600-\u06FF\s]+$/;
        return persianRegex.test(name.trim());
    }

    // اعتبارسنجی شماره تلفن (شروع با 0 و طول 11)
    function validatePhone(phone) {
        const phoneRegex = /^0[0-9]{10}$/;
        return phoneRegex.test(phone.trim());
    }

    // اضافه کردن به سبد با محدودیت 10 عدد
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.id;
            if (cart[id] >= 10) {
                showMessage('bookModal', 'حداکثر 10 عدد از هر کتاب قابل سفارش است!', 'error');
                return;
            }
            cart[id] = (cart[id] || 0) + 1;
            saveCart();
            updateCartIcon();
            const title = JSON.parse(document.querySelector(`.book-card .btn[data-details*='"id":"${id}"']`).dataset.details).title;
            showMessage('bookModal', `${title} به سبد خرید اضافه شد.`, 'success');
        });
    });

    // مدیریت پاپ‌آپ جزئیات
    const bookModal = document.getElementById('bookModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalPages = document.getElementById('modalPages');
    const modalPrint = document.getElementById('modalPrint');
    const modalDesc = document.getElementById('modalDesc');
    const addToCartBtn = document.querySelector('.add-to-cart');

    document.querySelectorAll('.book-card .btn').forEach(button => {
        button.addEventListener('click', () => {
            const details = JSON.parse(button.dataset.details);
            modalTitle.textContent = details.title;
            modalPrice.textContent = details.priceText;
            modalPages.textContent = details.pages;
            modalPrint.textContent = details.print;
            modalDesc.textContent = details.desc;
            addToCartBtn.dataset.id = details.id;
            bookModal.style.display = 'flex';
        });
    });

    document.querySelector('#bookModal .close').addEventListener('click', () => {
        bookModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === bookModal) {
            bookModal.style.display = 'none';
        }
    });

    // مدیریت پاپ‌آپ سبد خرید
    const cartModal = document.getElementById('cartModal');
    document.querySelector('.cart-icon').addEventListener('click', () => {
        updateCartModal();
        cartModal.style.display = 'flex';
    });

    document.querySelector('#cartModal .close').addEventListener('click', () => {
        cartModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            cartModal.style.display = 'none';
        }
    });

    // مدیریت تعداد آیتم‌ها در سبد با محدودیت 10 عدد
    document.getElementById('cartItems').addEventListener('click', (e) => {
        if (e.target.classList.contains('quantity-btn')) {
            const id = e.target.dataset.id;
            if (e.target.classList.contains('increase')) {
                if (cart[id] >= 10) {
                    showMessage('cartModal', 'حداکثر 10 عدد از هر کتاب قابل سفارش است!', 'error');
                    return;
                }
                cart[id]++;
            } else if (e.target.classList.contains('decrease')) {
                cart[id]--;
                if (cart[id] <= 0) delete cart[id];
            }
            saveCart();
            updateCartIcon();
            updateCartModal();
        }
    });

    // نهایی کردن سفارش
    document.querySelector('.checkout').addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Checkout button clicked');
        if (Object.keys(cart).length === 0) {
            showMessage('cartModal', 'سبد خرید خالی است', 'error');
        } else {
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

            if (userName && userPhone) {
                generateJSON(userName, userPhone);
                showMessage('cartModal', 'سفارش شما ثبت شد و نتیجه آن به شما اطلاع داده می‌شود', 'success');
                cart = {};
                saveCart();
                updateCartIcon();
                updateCartModal();
                document.getElementById('cartModal').style.display = 'none';
                document.getElementById('userName').value = '';
                document.getElementById('userPhone').value = '';
            } else {
                showMessage('cartModal', 'لطفاً نام و شماره تماس را وارد کنید.', 'error');
            }
        }
    });

    // فرم ثبت‌نام کلاس‌ها
    const contactForm = document.getElementById('contactForm');
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const grade = document.getElementById('grade').options[document.getElementById('grade').selectedIndex].text;
        const major = document.getElementById('major').options[document.getElementById('major').selectedIndex].text;

        if (name && phone && grade && major) {
            const message = encodeURIComponent(
                `ثبت‌نام کلاس\n` +
                `نام: ${name}\n` +
                `شماره تماس: ${phone}\n` +
                `پایه تحصیلی: ${grade}\n` +
                `رشته تحصیلی: ${major}`
            );
            window.open(`https://www.instagram.com/direct/new/?text=${message}`, '_blank');
            contactForm.reset();
        } else {
            showMessage('contactForm', 'لطفاً تمام فیلدها را پر کنید.', 'error');
        }
    });

    // آپدیت اولیه سبد
    updateCartIcon();
});