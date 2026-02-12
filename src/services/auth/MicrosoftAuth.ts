import { PublicClientApplication, type AuthenticationResult } from '@azure/msal-browser';
import { MICROSOFT_CONFIG } from '../../config/auth';

const msalConfig = {
    auth: {
        clientId: MICROSOFT_CONFIG.clientId,
        authority: MICROSOFT_CONFIG.authority,
        redirectUri: MICROSOFT_CONFIG.redirectUri,
    },
    cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: false,
    },
};

const msalInstance = new PublicClientApplication(msalConfig);

export class MicrosoftAuth {
    private static initialized = false;

    private static async ensureInitialized() {
        if (!this.initialized) {
            await msalInstance.initialize();
            this.initialized = true;
        }
    }

    static async login(): Promise<AuthenticationResult> {
        if (!MICROSOFT_CONFIG.clientId || MICROSOFT_CONFIG.clientId.includes('YOUR_MICROSOFT_CLIENT_ID')) {
            throw new Error('Microsoft Client ID not configured. Please paste your Client ID in src/config/auth.ts');
        }
        await this.ensureInitialized();
        try {
            const response = await msalInstance.loginPopup({
                scopes: MICROSOFT_CONFIG.scopes,
                prompt: 'select_account'
            });
            return response;
        } catch (error) {
            console.error('Microsoft Login Error:', error);
            throw error;
        }
    }

    static async getAccessToken(): Promise<string> {
        await this.ensureInitialized();
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length === 0) throw new Error('No Microsoft account found');

        try {
            const response = await msalInstance.acquireTokenSilent({
                scopes: MICROSOFT_CONFIG.scopes,
                account: accounts[0],
            });
            return response.accessToken;
        } catch (error) {
            const response = await msalInstance.acquireTokenPopup({
                scopes: MICROSOFT_CONFIG.scopes,
            });
            return response.accessToken;
        }
    }

    static async logout(): Promise<void> {
        await this.ensureInitialized();
        await msalInstance.logoutPopup();
    }
}
