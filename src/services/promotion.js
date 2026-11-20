import axios from 'axios';

export function getPromotion(config) {

    const client = axios.create({
        baseURL: config.site_url,
        headers: {
            'Content-Type': 'application/json'
        }
    });

    async function request() {
        if (process.env.NODE_ENV === 'development') {
            const response = await axios.get("promo_ajax.txt?ts=" + Date.now());
            return response.data;
        }

        const formData = new FormData(); // pass data as a form;
        formData.append(config.astroid_admin_token, 1);

        const response = await client.post(
            'administrator/index.php',
            formData,
            {
                params: {
                    option: 'com_ajax',
                    astroid: 'get-astroid-promotion',
                    ts: Date.now()
                }
            }
        );

        return response.data;
    }

    return {
        request
    };
}