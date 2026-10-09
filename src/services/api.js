import axios from 'axios';

export function createApi(config) {

    const client = axios.create({
        baseURL: config.base_url,
        headers: {
            'Content-Type': 'application/json'
        }
    });

    async function moodleRequest(method, args = {}) {

        const requests = [
            {
                index: 0,
                methodname: method,
                args
            }
        ];

        return client.post(
            '/lib/ajax/service.php',
            JSON.stringify(requests),
            {
                params: {
                    sesskey: config.astroid_admin_token,
                    info: method
                }
            }
        );
    }

    return {
        moodleRequest
    };
}