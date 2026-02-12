export const GOOGLE_CONFIG = {
    // Replace with your actual Client ID from Google Cloud Console
    clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ],
};

export const MICROSOFT_CONFIG = {
    // Replace with your actual Client ID from Azure Portal
    clientId: 'YOUR_MICROSOFT_CLIENT_ID',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
    scopes: [
        'Files.ReadWrite.AppFolder',
        'User.Read',
        'openid',
        'profile',
        'email'
    ],
};
