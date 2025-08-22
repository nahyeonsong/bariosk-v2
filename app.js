(function () {
    const STORAGE_KEYS = {
        categories: "bariosk.categories.v1",
        menus: "bariosk.menus.v1",
    };

    /** State */
    let state = {
        categories: [],
        menus: [],
        cart: [],
        selectedCategoryId: null,
        adminMode: false,
    };

    /** Utils */
    const formatPrice = (n) => (n || 0).toLocaleString("ko-KR") + "원";
    const uid = () => Math.random().toString(36).slice(2, 10);
    const save = () => {
        localStorage.setItem(
            STORAGE_KEYS.categories,
            JSON.stringify(state.categories)
        );
        localStorage.setItem(STORAGE_KEYS.menus, JSON.stringify(state.menus));
    };
    const load = () => {
        try {
            const cats = JSON.parse(
                localStorage.getItem(STORAGE_KEYS.categories) || "[]"
            );
            const menus = JSON.parse(
                localStorage.getItem(STORAGE_KEYS.menus) || "[]"
            );
            if (Array.isArray(cats) && cats.length) state.categories = cats;
            if (Array.isArray(menus) && menus.length) state.menus = menus;
        } catch (e) {
            /* ignore */
        }
    };

    /** Seed default data if empty */
    const seedIfEmpty = () => {
        if (state.categories.length === 0) {
            const coffeeId = uid();
            const adeId = uid();
            state.categories = [
                { id: coffeeId, name: "커피", order: 0 },
                { id: adeId, name: "에이드", order: 1 },
            ];
            state.menus = [
                {
                    id: uid(),
                    categoryId: coffeeId,
                    name: "아메리카노",
                    price: 3000,
                    order: 0,
                },
                {
                    id: uid(),
                    categoryId: coffeeId,
                    name: "카페라떼",
                    price: 4000,
                    order: 1,
                },
                {
                    id: uid(),
                    categoryId: adeId,
                    name: "자몽에이드",
                    price: 4500,
                    order: 0,
                },
            ];
            state.selectedCategoryId = coffeeId;
            save();
        }
        if (state.selectedCategoryId == null && state.categories[0]) {
            state.selectedCategoryId = state.categories[0].id;
        }
    };

    /** DOM */
    const el = (id) => document.getElementById(id);
    const categoryTabs = el("categoryTabs");
    const menuGrid = el("menuGrid");
    const cartList = el("cartList");
    const cartTotal = el("cartTotal");
    const printBtn = el("printBtn");
    const clearCartBtn = el("clearCartBtn");
    const adminPanel = el("adminPanel");
    const closeAdminBtn = el("closeAdminBtn");
    const brandLogo = el("brandLogo");

    const categoryForm = el("categoryForm");
    const categoryNameInput = el("categoryNameInput");
    const categoryAdminList = el("categoryAdminList");

    const menuCategorySelect = el("menuCategorySelect");
    const menuForm = el("menuForm");
    const menuNameInput = el("menuNameInput");
    const menuPriceInput = el("menuPriceInput");
    const menuAdminList = el("menuAdminList");

    /** Renderers */
    const renderCategories = () => {
        const sorted = [...state.categories].sort((a, b) => a.order - b.order);
        categoryTabs.innerHTML = "";
        sorted.forEach((cat) => {
            const btn = document.createElement("button");
            btn.className =
                "tab" + (cat.id === state.selectedCategoryId ? " active" : "");
            btn.textContent = cat.name;
            btn.addEventListener("click", () => {
                state.selectedCategoryId = cat.id;
                renderCategories();
                renderMenu();
            });
            categoryTabs.appendChild(btn);
        });

        // admin select
        menuCategorySelect.innerHTML = "";
        sorted.forEach((cat) => {
            const opt = document.createElement("option");
            opt.value = cat.id;
            opt.textContent = cat.name;
            menuCategorySelect.appendChild(opt);
        });
    };

    const renderMenu = () => {
        const items = state.menus
            .filter((m) => m.categoryId === state.selectedCategoryId)
            .sort((a, b) => a.order - b.order);
        menuGrid.innerHTML = "";
        items.forEach((item) => {
            const card = document.createElement("div");
            card.className = "menu-card";
            const title = document.createElement("div");
            title.className = "menu-title";
            title.textContent = item.name;
            const price = document.createElement("div");
            price.className = "menu-price";
            price.textContent = formatPrice(item.price);
            const addBtn = document.createElement("button");
            addBtn.className = "primary";
            addBtn.textContent = "담기";
            addBtn.addEventListener("click", () => addToCart(item));
            card.appendChild(title);
            card.appendChild(price);
            card.appendChild(addBtn);
            menuGrid.appendChild(card);
        });
    };

    const renderCart = () => {
        cartList.innerHTML = "";
        let total = 0;
        state.cart.forEach((ci) => {
            total += ci.price * ci.qty;
            const row = document.createElement("div");
            row.className = "cart-item";
            const left = document.createElement("div");
            left.className = "name";
            left.textContent = ci.name;
            const right = document.createElement("div");
            right.className = "controls";
            const price = document.createElement("span");
            price.textContent = formatPrice(ci.price * ci.qty);
            const qty = document.createElement("div");
            qty.className = "qty";
            const dec = document.createElement("button");
            dec.textContent = "-";
            const count = document.createElement("span");
            count.textContent = ci.qty;
            const inc = document.createElement("button");
            inc.textContent = "+";
            const rm = document.createElement("button");
            rm.className = "danger";
            rm.textContent = "삭제";
            dec.addEventListener("click", () => changeQty(ci.id, -1));
            inc.addEventListener("click", () => changeQty(ci.id, +1));
            rm.addEventListener("click", () => removeFromCart(ci.id));
            qty.appendChild(dec);
            qty.appendChild(count);
            qty.appendChild(inc);
            right.appendChild(qty);
            right.appendChild(price);
            right.appendChild(rm);
            row.appendChild(left);
            row.appendChild(right);
            cartList.appendChild(row);
        });
        cartTotal.textContent = formatPrice(total);
    };

    const renderAdmin = () => {
        // categories
        const cats = [...state.categories].sort((a, b) => a.order - b.order);
        categoryAdminList.innerHTML = "";
        cats.forEach((cat, idx) => {
            const row = document.createElement("div");
            row.className = "admin-row";
            const nameInput = document.createElement("input");
            nameInput.value = cat.name;
            nameInput.addEventListener("change", () => {
                cat.name = nameInput.value.trim() || cat.name;
                save();
                renderCategories();
                renderAdmin();
            });
            const actions = document.createElement("div");
            actions.className = "actions";
            const up = document.createElement("button");
            up.textContent = "▲";
            up.disabled = idx === 0;
            const down = document.createElement("button");
            down.textContent = "▼";
            down.disabled = idx === cats.length - 1;
            const del = document.createElement("button");
            del.className = "danger";
            del.textContent = "삭제";
            up.addEventListener("click", () => moveCategory(cat.id, -1));
            down.addEventListener("click", () => moveCategory(cat.id, +1));
            del.addEventListener("click", () => deleteCategory(cat.id));
            actions.appendChild(up);
            actions.appendChild(down);
            actions.appendChild(del);
            row.appendChild(nameInput);
            row.appendChild(actions);
            categoryAdminList.appendChild(row);
        });

        // menus for selected category in admin select
        const catId = menuCategorySelect.value || (cats[0] && cats[0].id);
        if (catId && menuCategorySelect.value !== catId)
            menuCategorySelect.value = catId;
        const menus = state.menus
            .filter((m) => m.categoryId === catId)
            .sort((a, b) => a.order - b.order);
        menuAdminList.innerHTML = "";
        menus.forEach((m, idx) => {
            const row = document.createElement("div");
            row.className = "admin-row";
            const name = document.createElement("input");
            name.value = m.name;
            name.addEventListener("change", () => {
                m.name = name.value.trim() || m.name;
                save();
                renderMenu();
                renderAdmin();
            });
            const price = document.createElement("input");
            price.type = "number";
            price.min = "0";
            price.step = "100";
            price.value = m.price;
            price.addEventListener("change", () => {
                m.price = parseInt(price.value || "0", 10);
                save();
                renderMenu();
                renderCart();
                renderAdmin();
            });
            const left = document.createElement("div");
            left.className = "row";
            left.appendChild(name);
            left.appendChild(price);
            const actions = document.createElement("div");
            actions.className = "actions";
            const up = document.createElement("button");
            up.textContent = "▲";
            up.disabled = idx === 0;
            const down = document.createElement("button");
            down.textContent = "▼";
            down.disabled = idx === menus.length - 1;
            const del = document.createElement("button");
            del.className = "danger";
            del.textContent = "삭제";
            up.addEventListener("click", () => moveMenu(m.id, -1));
            down.addEventListener("click", () => moveMenu(m.id, +1));
            del.addEventListener("click", () => deleteMenu(m.id));
            const right = document.createElement("div");
            right.className = "actions";
            right.appendChild(up);
            right.appendChild(down);
            right.appendChild(del);
            row.appendChild(left);
            row.appendChild(right);
            menuAdminList.appendChild(row);
        });
    };

    /** Cart ops */
    const addToCart = (item) => {
        const exists = state.cart.find((ci) => ci.id === item.id);
        if (exists) {
            exists.qty += 1;
        } else {
            state.cart.push({
                id: item.id,
                name: item.name,
                price: item.price,
                qty: 1,
            });
        }
        renderCart();
    };
    const changeQty = (id, delta) => {
        const ci = state.cart.find((c) => c.id === id);
        if (!ci) return;
        ci.qty += delta;
        if (ci.qty <= 0) state.cart = state.cart.filter((c) => c.id !== id);
        renderCart();
    };
    const removeFromCart = (id) => {
        state.cart = state.cart.filter((c) => c.id !== id);
        renderCart();
    };
    const clearCart = () => {
        state.cart = [];
        renderCart();
    };

    /** Category ops */
    const moveCategory = (id, dir) => {
        const sorted = [...state.categories].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((c) => c.id === id);
        const swapIdx = idx + dir;
        if (swapIdx < 0 || swapIdx >= sorted.length) return;
        const a = sorted[idx];
        const b = sorted[swapIdx];
        const temp = a.order;
        a.order = b.order;
        b.order = temp;
        state.categories = sorted;
        save();
        renderCategories();
        renderAdmin();
    };
    const deleteCategory = (id) => {
        // 삭제 시 해당 카테고리 메뉴도 삭제
        state.menus = state.menus.filter((m) => m.categoryId !== id);
        state.categories = state.categories
            .filter((c) => c.id !== id)
            .map((c, i) => ({ ...c, order: i }));
        if (state.selectedCategoryId === id) {
            state.selectedCategoryId = state.categories[0]
                ? state.categories[0].id
                : null;
        }
        save();
        renderCategories();
        renderMenu();
        renderAdmin();
    };

    /** Menu ops */
    const moveMenu = (id, dir) => {
        const m = state.menus.find((x) => x.id === id);
        if (!m) return;
        const list = state.menus
            .filter((x) => x.categoryId === m.categoryId)
            .sort((a, b) => a.order - b.order);
        const idx = list.findIndex((x) => x.id === id);
        const swapIdx = idx + dir;
        if (swapIdx < 0 || swapIdx >= list.length) return;
        const a = list[idx];
        const b = list[swapIdx];
        const temp = a.order;
        a.order = b.order;
        b.order = temp;
        // apply back
        state.menus = state.menus.map((x) => {
            if (x.id === a.id) return a;
            if (x.id === b.id) return b;
            return x;
        });
        save();
        renderMenu();
        renderAdmin();
    };
    const deleteMenu = (id) => {
        const m = state.menus.find((x) => x.id === id);
        if (!m) return;
        state.menus = state.menus
            .filter((x) => x.id !== id)
            .map((x, i) =>
                x.categoryId === m.categoryId ? { ...x, order: i } : x
            );
        // 장바구니에도 있으면 제거
        removeFromCart(id);
        save();
        renderMenu();
        renderAdmin();
    };

    /** Receipt */
    const buildReceiptHtml = () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        const total = state.cart.reduce((s, ci) => s + ci.price * ci.qty, 0);
        const rows = state.cart
            .map(
                (ci) => `
      <tr>
        <td>${ci.name} x ${ci.qty}</td>
        <td style="text-align:right">${formatPrice(ci.price * ci.qty)}</td>
      </tr>
    `
            )
            .join("");
        return `
      <div class="rc-header">
        <div class="rc-title">Bariosk 주문서</div>
        <div class="rc-time">${y}-${m}-${d} ${hh}:${mm}</div>
      </div>
      <table class="rc-table">
        <tbody>${rows}</tbody>
      </table>
      <div class="rc-total">합계: ${formatPrice(total)}</div>
      <div class="rc-footer">감사합니다. 좋은 하루 되세요!</div>
    `;
    };

    const printOrder = () => {
        if (!state.cart.length) {
            alert("장바구니가 비어있습니다.");
            return;
        }
        const receiptContent = document.getElementById("receiptContent");
        receiptContent.innerHTML = buildReceiptHtml();
        window.print();
    };

    /** Admin toggle by long press */
    const setupLongPress = (target, callback, holdMs = 1200) => {
        let timer = null;
        const start = () => {
            clear();
            timer = setTimeout(() => callback(), holdMs);
        };
        const clear = () => {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
        };
        target.addEventListener("mousedown", start);
        target.addEventListener("touchstart", start);
        [
            "mouseup",
            "mouseleave",
            "mouseout",
            "touchend",
            "touchcancel",
        ].forEach((evt) => {
            target.addEventListener(evt, clear);
        });
    };

    const openAdmin = () => {
        state.adminMode = true;
        adminPanel.classList.remove("hidden");
        renderAdmin();
    };
    const closeAdmin = () => {
        state.adminMode = false;
        adminPanel.classList.add("hidden");
    };

    /** Event bindings */
    const bindEvents = () => {
        printBtn.addEventListener("click", printOrder);
        clearCartBtn.addEventListener("click", clearCart);
        closeAdminBtn.addEventListener("click", closeAdmin);
        setupLongPress(brandLogo, () => {
            if (state.adminMode) closeAdmin();
            else openAdmin();
        });

        categoryForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = categoryNameInput.value.trim();
            if (!name) return;
            const order = state.categories.length;
            const id = uid();
            state.categories.push({ id, name, order });
            categoryNameInput.value = "";
            save();
            renderCategories();
            renderAdmin();
            if (!state.selectedCategoryId) state.selectedCategoryId = id;
        });

        menuForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = menuNameInput.value.trim();
            const price = parseInt(menuPriceInput.value || "0", 10);
            const categoryId = menuCategorySelect.value;
            if (!name || !categoryId) return;
            const order = state.menus.filter(
                (m) => m.categoryId === categoryId
            ).length;
            state.menus.push({ id: uid(), categoryId, name, price, order });
            menuNameInput.value = "";
            menuPriceInput.value = "";
            save();
            renderMenu();
            renderAdmin();
        });

        menuCategorySelect.addEventListener("change", renderAdmin);
    };

    /** Init */
    const init = () => {
        load();
        seedIfEmpty();
        bindEvents();
        renderCategories();
        renderMenu();
        renderCart();
    };

    document.addEventListener("DOMContentLoaded", init);
})();
