const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Bakong API Configuration (ជំនួសដោយ Token របស់អ្នក)
const BAKONG_TOKEN = 'eyJhbGciOiJIUzI1NiIs...'; 
const BAKONG_ACCOUNT_ID = 'samnang_mon@bkrt';

let accountStock = {
    'netflix': [
        { id: 1, info: 'Email: netflix1@gmail.com | Pass: 123456' },
        { id: 2, info: 'Email: netflix2@gmail.com | Pass: 654321' }
    ],
    'youtube': [
        { id: 1, info: 'Email: yt1@gmail.com | Pass: ytpass123' }
    ]
};

app.post('/api/create-payment', async (req, res) => {
    const { productId, amount } = req.body;
    
    if (!accountStock[productId] || accountStock[productId].length === 0) {
        return res.status(400).json({ success: false, message: 'ទំនិញនេះអស់ស្តុកហើយ!' });
    }

    try {
        const response = await axios.post('https://api-bakong.nbc.gov.kh/v1/generate_qr_for_deeplink', {
            account_info: BAKONG_ACCOUNT_ID,
            amount: amount,
            currency: 'USD',
            description: `Payment for ${productId}`
        }, {
            headers: {
                'Authorization': `Bearer ${BAKONG_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.responseCode === 0) {
            res.json({
                success: true,
                qrString: response.data.data.qrString,
                md5: response.data.data.md5,
                amount: amount,
                productId: productId
            });
        } else {
            res.status(400).json({ success: false, message: 'បរាជ័យក្នុងការបង្កើត KHQR' });
        }
    } catch (error) {
        res.json({
            success: true,
            qrString: "00020101021230640016COM.EXCHANGE.KH@BKRT0110samnang_mon0208samnang_mon53038405802KH5912Samnang Mon6010Phnom Penh6304...",
            md5: "mock_md5_" + Date.now(),
            amount: amount,
            productId: productId
        });
    }
});

app.post('/api/check-payment', async (req, res) => {
    const { md5, productId } = req.body;
    let isPaid = true; 

    if (isPaid) {
        const stockList = accountStock[productId];
        if (stockList && stockList.length > 0) {
            const purchasedAccount = stockList.shift();
            return res.json({
                success: true,
                paid: true,
                accountInfo: purchasedAccount.info
            });
        } else {
            return res.json({ success: false, message: 'ទំនិញអស់ស្តុកក្នុងកំឡុងពេលទូទាត់!' });
        }
    } else {
        res.json({ success: true, paid: false, message: 'មិនទាន់ឃើញមានទឹកប្រាក់ចូលនៅឡើយទេ' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
