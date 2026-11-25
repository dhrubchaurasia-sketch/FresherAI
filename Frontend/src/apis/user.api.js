
import api from "../utils/axios.js";

export const getCurrentUser = async () => {
    try {
        const response = await api.get("/api/me", {
            params: {
                _t: Date.now()
            },
            headers: {
                "Cache-Control": "no-cache",
                "Pragma": "no-cache"
            }
        });

        console.log("FRESH USER API RESPONSE:", response.data);

        return response.data;

    } catch (error) {
        console.error(
            "Get Current User Error:",
            error.response?.data || error.message
        );

        return null;
    }
};

export const useCoins = async (action) => {
    try {
        const response = await api.post("/api/auth/use-coins", { action });      
        return response.data;
    } catch (error) {
        console.error(
            "Use Coins Error:",
            error.response?.data || error.message
        );

        return error.response?.data || { success: false, message: error.message || "Coin deduction failed", };
    }
};


// Create Razorpay Order
export const createPaymentOrder = async (packageId) => {
    try {
        const response = await api.post("/api/billing/create-order", {
            packageId
        });

        return response.data;
    } catch (error) {
        console.error(
            "Create Payment Order Error:",
            error.response?.data || error.message
        );

        return error.response?.data || {
            success: false,
            message: "Unable to create payment order"
        };
    }
};


// Verify Razorpay Payment
export const verifyPayment = async (paymentData) => {
    try {
        const response = await api.post(
            "/api/billing/verify-payment",
            paymentData
        );

        return response.data;
    } catch (error) {
        console.error(
            "Verify Payment Error:",
            error.response?.data || error.message
        );

        return error.response?.data || {
            success: false,
            message: "Payment verification failed"
        };
    }
};
