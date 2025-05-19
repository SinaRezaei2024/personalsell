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

    // تابع کمکی برای تبدیل باینری به فایل
    function s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }

    // ایجاد فایل اکسل
    function generateExcel(userName, userPhone) {
        try {
            console.log('Generating Excel...');
            console.log('User:', userName, 'Phone:', userPhone, 'Cart:', cart);

            const now = moment();
            const jalaaliDate = now.format('jYYYY/jMM/jDD');
            const time = now.format('HH:mm');

            // داده‌های هدر
            const headerData = [
                ['نام سفارش‌دهنده', 'تاریخ', 'ساعت'],
                [userName, jalaaliDate, time],
                [] // خط خالی
            ];

            // داده‌های جدول
            const tableHeaders = ['قیمت کل (تومان)', 'تعداد', 'قیمت واحد (تومان)', 'نام جزوه'];
            let tableRows = [];
            let totalPrice = 0;

            for (const id in cart) {
                if (cart[id] > 0) {
                    const item = document.querySelector(`.book-card .btn[data-details*='"id":"${id}"']`).dataset.details;
                    const details = JSON.parse(item);
                    const itemTotal = details.price * cart[id];
                    totalPrice += itemTotal;
                    tableRows.push([
                        itemTotal.toLocaleString('fa-IR'),
                        cart[id],
                        details.price.toLocaleString('fa-IR'),
                        details.title
                    ]);
                }
            }
            tableRows.push(['', '', '', 'جمع کل']);
            tableRows.push([totalPrice.toLocaleString('fa-IR'), '', '', '']);

            // ترکیب داده‌ها
            const wsData = [
                ...headerData,
                tableHeaders,
                ...tableRows
            ];

            // ایجاد شیت با جهت RTL
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            ws['!cols'] = [
                { wpx: 120 }, // قیمت کل
                { wpx: 80 },  // تعداد
                { wpx: 120 }, // قیمت واحد
                { wpx: 250 }  // نام جزوه
            ];
            ws['!rows'] = wsData.map(() => ({ hpx: 30 }));
            ws['!dir'] = 'rtl';

            // تنظیم راست‌چین و حاشیه برای سلول‌ها
            for (let R = 0; R < wsData.length; R++) {
                for (let C = 0; C < wsData[R].length; C++) {
                    const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws[cellRef]) continue;
                    ws[cellRef].s = {
                        alignment: { horizontal: 'right', vertical: 'center' },
                        border: {
                            top: { style: 'thin', color: { rgb: '000000' } },
                            bottom: { style: 'thin', color: { rgb: '000000' } },
                            left: { style: 'thin', color: { rgb: '000000' } },
                            right: { style: 'thin', color: { rgb: '000000' } }
                        }
                    };
                }
            }

            // ایجاد فایل اکسل
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'سفارش');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
            const fileName = `order_${jalaaliDate}_${time.replace(':', '-')}.xlsx`;

            // دانلود فایل
            const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(link.href);

            console.log('Excel generated successfully:', fileName);
        } catch (error) {
            console.error('Error generating Excel:', error);
            alert('خطایی در تولید فایل اکسل رخ داد. لطفاً دوباره امتحان کنید.');
        }
    }

    // اضافه کردن به سبد با محدودیت 10 عدد
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.id;
            if (cart[id] >= 10) {
                alert('حداکثر 10 عدد از هر کتاب قابل سفارش است!');
                return;
            }
            cart[id] = (cart[id] || 0) + 1;
            saveCart();
            updateCartIcon();
            alert(`${JSON.parse(document.querySelector(`.book-card .btn[data-details*='"id":"${id}"']`).dataset.details).title} به سبد خرید اضافه شد.`);
            document.getElementById('bookModal').style.display = 'none';
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
                    alert('حداکثر 10 عدد از هر کتاب قابل سفارش است!');
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
            alert('سبد خرید خالی است!');
        } else {
            const userName = document.getElementById('userName').value.trim();
            const userPhone = document.getElementById('userPhone').value.trim();
            if (userName && userPhone) {
                generateExcel(userName, userPhone);
                alert('سفارش ثبت شد و فایل اکسل دانلود شد.');
                cart = {};
                saveCart();
                updateCartIcon();
                updateCartModal();
                document.getElementById('cartModal').style.display = 'none';
                document.getElementById('userName').value = '';
                document.getElementById('userPhone').value = '';
            } else {
                alert('لطفاً نام و شماره تماس را وارد کنید.');
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
            alert('لطفاً تمام فیلدها را پر کنید.');
        }
    });

    // آپدیت اولیه سبد
    updateCartIcon();
});