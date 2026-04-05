
export const isBiometricSupported = async (): Promise<boolean> => {
  if (!window.PublicKeyCredential) return false;
  
  // Check if platform authenticator is available (e.g., TouchID, FaceID, Windows Hello)
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};

export const registerBiometric = async (username: string = "user"): Promise<string | null> => {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));

    const creationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: "SecureCard Vault",
        id: window.location.hostname,
      },
      user: {
        id: userId,
        name: username,
        displayName: username,
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256
        { alg: -257, type: "public-key" }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
      },
      timeout: 60000,
    };

    const credential = await navigator.credentials.create({
      publicKey: creationOptions,
    });

    if (credential) {
      // In a real app, we'd store the credential ID on a server.
      // Locally, we'll just store it in localStorage to "know" we registered.
      const cred = credential as PublicKeyCredential;
      const credentialId = btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));
      localStorage.setItem("biometric_credential_id", credentialId);
      return credentialId;
    }
    return null;
  } catch (error) {
    console.error("Biometric registration failed:", error);
    return null;
  }
};

export const authenticateBiometric = async (): Promise<boolean> => {
  try {
    const credentialIdStr = localStorage.getItem("biometric_credential_id");
    if (!credentialIdStr) return false;

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const credentialId = Uint8Array.from(atob(credentialIdStr), (c) => c.charCodeAt(0));

    const assertionOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: [
        {
          id: credentialId,
          type: "public-key",
        },
      ],
      userVerification: "required",
      timeout: 60000,
    };

    const assertion = await navigator.credentials.get({
      publicKey: assertionOptions,
    });

    return !!assertion;
  } catch (error) {
    console.error("Biometric authentication failed:", error);
    return false;
  }
};
