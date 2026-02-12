import { GOOGLE_CONFIG } from '../../config/auth';

export interface GoogleTokenResponse {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
}

export class GoogleAuth {
    private static scriptLoaded = false;

    private static loadScript(): Promise<void> {
        if (this.scriptLoaded) return Promise.resolve();
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                this.scriptLoaded = true;
                resolve();
            };
            document.head.appendChild(script);
        });
    }

    static async login(): Promise<GoogleTokenResponse> {
        if (!GOOGLE_CONFIG.clientId || GOOGLE_CONFIG.clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
            throw new Error('Google Client ID not configured. Please paste your Client ID in src/config/auth.ts');
        }

        await this.loadScript();

        return new Promise((resolve, reject) => {
            try {
                // @ts-ignore
                const client = google.accounts.oauth2.initTokenClient({
                    client_id: GOOGLE_CONFIG.clientId,
                    scope: GOOGLE_CONFIG.scopes.join(' '),
                    callback: (response: any) => {
                        if (response.error) {
                            reject(response);
                        } else {
                            resolve(response as GoogleTokenResponse);
                        }
                    },
                });
                client.requestAccessToken();
            } catch (error) {
                reject(error);
            }
        });
    }
}
