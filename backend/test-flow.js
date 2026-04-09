async function testFlow() {
    console.log('🤖 Grab & Go Automated Flow Tester');
    console.log('===================================');
    console.log('Testing customer -> vendor -> rider -> delivered workflow');

    const readEnv = (key) => {
        const value = process.env[key];
        if (!value) {
            throw new Error(`Missing required env var: ${key}`);
        }
        return value;
    };

    const baseUrl = readEnv('TEST_API_BASE_URL');
    const cfg = {
        customerEmail: readEnv('TEST_CUSTOMER_EMAIL'),
        customerPassword: readEnv('TEST_CUSTOMER_PASSWORD'),
        vendorEmail: readEnv('TEST_VENDOR_EMAIL'),
        vendorPassword: readEnv('TEST_VENDOR_PASSWORD'),
        riderEmail: readEnv('TEST_RIDER_EMAIL'),
        riderPassword: readEnv('TEST_RIDER_PASSWORD'),
        customerName: readEnv('TEST_CUSTOMER_NAME'),
        customerPhone: readEnv('TEST_CUSTOMER_PHONE'),
        customerAddress: readEnv('TEST_CUSTOMER_ADDRESS'),
        quantity: Number(readEnv('TEST_ORDER_QUANTITY')),
    };

    // Helper for requests
    async function request(method, path, body = null, cookie = null) {
        const headers = { 'Content-Type': 'application/json' };
        if (cookie) headers['Cookie'] = cookie;

        const res = await fetch(`${baseUrl}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });
        const setCookie = res.headers.get('set-cookie');
        const data = await res.json().catch(() => null);
        return {
            status: res.status,
            ok: res.ok,
            data,
            cookie: setCookie ? setCookie.split(';')[0] : cookie
        };
    }

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    try {
        // 1. Customer makes an order
        console.log('\n[1/4] 🧑‍🦱 Customer logging in and placing an order...');
        let { cookie: customerCookie, status: customerLoginStatus, data: customerLoginData } = await request('POST', '/api/auth/login', { email: cfg.customerEmail, password: cfg.customerPassword });
        if (!customerCookie) throw new Error("Customer login failed.");
        console.log(`Customer login OK (${customerLoginStatus}) as ${customerLoginData?.user?.email || 'unknown'}`);

        let { cookie: vendorCookie } = await request('POST', '/api/auth/login', { email: cfg.vendorEmail, password: cfg.vendorPassword });
        if (!vendorCookie) throw new Error('Vendor login failed.');

        let { data: vendorShopsData } = await request('GET', '/api/shops/my-shops', null, vendorCookie);
        const vendorShops = vendorShopsData?.shops || [];
        if (!vendorShops.length) throw new Error('Vendor has no shops available for testing.');

        // Get a product from a vendor-owned shop so the vendor status update is authorized
        let selectedShop = null;
        let selectedProduct = null;

        for (const shop of vendorShops) {
            const { data: shopProductsData } = await request('GET', `/api/products?shopId=${encodeURIComponent(shop.id)}`);
            const products = shopProductsData?.products || [];
            if (products.length > 0) {
                selectedShop = shop;
                selectedProduct = products[0];
                break;
            }
        }

        if (!selectedShop || !selectedProduct) {
            throw new Error('No shop with available products found.');
        }

        console.log(`Selected shop: ${selectedShop.name} | product: ${selectedProduct.name}`);

        // Place order
        const targetProductId = selectedProduct.id || selectedProduct._id || 'prod-1';
        let { data: orderResponse, status: orderStatus } = await request('POST', '/api/checkout', {
            items: [{ id: targetProductId, quantity: cfg.quantity, price: selectedProduct.price, name: selectedProduct.name }],
            shopId: selectedShop.id || selectedShop._id,
            customer: {
                name: cfg.customerName,
                phone: cfg.customerPhone,
                address: cfg.customerAddress
            },
            paymentMethod: 'cod',
            amount: Number(selectedProduct.price) * cfg.quantity
        }, customerCookie);

        if (!orderResponse || !orderResponse.order) throw new Error("Order creation failed: " + JSON.stringify(orderResponse));
        const orderId = orderResponse.order.id;
        console.log(`✅ Order placed (${orderStatus})! Order ID: ${orderId}`);
        console.log('⏳ Waiting 3 seconds before vendor step...');
        await sleep(3000);

        // 2. Vendor accepts
        console.log(`\n[2/4] 🏪 Vendor logging in and preparing order ${orderId}...`);
        const vendorStatusResponse = await request('PATCH', `/api/orders/${orderId}/status`, { status: 'preparing' }, vendorCookie);
        if (!vendorStatusResponse.ok) {
            throw new Error(`Vendor failed to set preparing status: ${JSON.stringify(vendorStatusResponse.data)}`);
        }

        console.log('✅ Status updated to: preparing');
        console.log('⏳ Waiting 3 seconds...');
        await sleep(3000);

        // 3. Rider accepts
        console.log(`\n[3/4] 🏍️ Rider logging in and accepting delivery for ${orderId}...`);
        let { cookie: riderCookie } = await request('POST', '/api/auth/login', { email: cfg.riderEmail, password: cfg.riderPassword });
        if (!riderCookie) throw new Error('Rider login failed.');

        const riderOnlineResponse = await request('PATCH', '/api/riders/online', { isOnline: true }, riderCookie);
        if (!riderOnlineResponse.ok) {
            throw new Error(`Rider failed to go online: ${JSON.stringify(riderOnlineResponse.data)}`);
        }

        const riderAcceptResponse = await request('POST', `/api/orders/${orderId}/accept`, {}, riderCookie);
        if (!riderAcceptResponse.ok && riderAcceptResponse.data?.error?.code !== 'ALREADY_ASSIGNED') {
            throw new Error(`Rider failed to accept order: ${JSON.stringify(riderAcceptResponse.data)}`);
        }

        if (riderAcceptResponse.ok) {
            console.log('✅ Rider accepted the order manually');
        } else {
            console.log('ℹ️ Order was already auto-assigned before manual accept; continuing with assigned rider flow');
        }

        const outForDeliveryResponse = await request('PATCH', `/api/orders/${orderId}/status`, { status: 'out_for_delivery' }, riderCookie);
        if (!outForDeliveryResponse.ok) {
            throw new Error(`Rider failed to set out_for_delivery: ${JSON.stringify(outForDeliveryResponse.data)}`);
        }

        console.log('✅ Status updated to: out_for_delivery');
        console.log('⏳ Waiting 3 seconds...');
        await sleep(3000);

        // 4. Rider delivers
        console.log(`\n[4/4] 🏍️ Rider delivering order ${orderId}...`);
        const deliveredResponse = await request('PATCH', `/api/orders/${orderId}/status`, { status: 'delivered' }, riderCookie);
        if (!deliveredResponse.ok) {
            throw new Error(`Rider failed to deliver order: ${JSON.stringify(deliveredResponse.data)}`);
        }

        const verifyOrderResponse = await request('GET', `/api/orders/${orderId}`, null, customerCookie);
        if (!verifyOrderResponse.ok) {
            throw new Error(`Customer failed to verify final order state: ${JSON.stringify(verifyOrderResponse.data)}`);
        }

        console.log(`✅ Status updated to: delivered`);
        console.log(`Final order state: ${verifyOrderResponse.data?.status || verifyOrderResponse.data?.order?.status || 'unknown'}`);

        console.log('\n🎉 End-to-End Test Complete!');
    } catch (err) {
        console.error('❌ Test failed:', err.message);
    }
}

testFlow();
