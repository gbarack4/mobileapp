import Svg, { Circle, Path } from 'react-native-svg';

export function PersonIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke="#9ca3af" strokeWidth="1.75" />
      <Path
        d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6"
        stroke="#9ca3af"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function LockIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 11V8a5 5 0 0110 0v3"
        stroke="#9ca3af"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <Path
        d="M6 11h12a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7a2 2 0 012-2z"
        stroke="#9ca3af"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function AppleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="#111827">
      <Path d="M16.365 1.43c0 1.14-.45 2.23-1.23 3.04-.83.86-2.19 1.53-3.36 1.44-.16-1.1.42-2.26 1.14-3.01.82-.85 2.25-1.48 3.45-1.47zM20.88 17.13c-.57 1.3-.85 1.88-1.58 3.03-1.02 1.57-2.46 3.53-4.25 3.54-1.59.01-2-.99-4.16-.98-2.16.01-2.62 1-4.21.99-1.79-.01-3.15-1.8-4.17-3.37-2.87-4.4-3.17-9.56-1.4-12.3 1.25-1.97 3.23-3.13 5.07-3.13 1.89 0 3.08 1.01 4.64 1.01 1.5 0 2.42-1.01 4.57-1.01 1.63 0 3.35.89 4.6 2.43-4.05 2.22-3.4 8.01.89 9.75z" />
    </Svg>
  );
}

export function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M21.8 12.2273c0-.7091-.0636-1.3091-.1909-1.9091H12v3.4727h5.5818c-.2455 1.1455-.9818 2.1273-2.0909 2.7818v2.2909h3.3818c1.9818-1.8273 3.1273-4.5091 3.1273-7.6363z"
        fill="#4285F4"
      />
      <Path
        d="M12 22c2.7 0 4.9636-.8909 6.6182-2.4182l-3.3818-2.2909c-.8909.6-2.0364.9545-3.2364.9545-2.4909 0-4.6-1.6818-5.3545-3.9455H3.2273v2.3727C4.8727 19.9818 8.1818 22 12 22z"
        fill="#34A853"
      />
      <Path
        d="M6.64545 14.3c-.2-.6-.3182-1.2364-.3182-1.9s.1182-1.3.3182-1.9V8.12727H3.22727C2.59091 9.50909 2.22727 11.2182 2.22727 12.4s.36364 2.8909 1 4.2727L6.64545 14.3z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.98182c1.4727 0 2.7818.5091 3.8182 1.4909l2.8545-2.85455C16.9545 3.12727 14.7 2.22727 12 2.22727 8.18182 2.22727 4.87273 4.24545 3.22727 7.62727l3.41818 2.37273C7.4 7.66364 9.50909 5.98182 12 5.98182z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export function PhoneIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 3h2.5a1.5 1.5 0 011.45 1.1l.7 2.8a1.5 1.5 0 01-.36 1.45l-1.5 1.5a12 12 0 005.96 5.96l1.5-1.5a1.5 1.5 0 011.45-.36l2.8.7A1.5 1.5 0 0121 15.5V18a2 2 0 01-2 2C10.82 20 4 13.18 4 5a2 2 0 012-2z"
        stroke="#111827"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChatIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 18l-3 3V6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H9l-2 2z"
        stroke="#111827"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function AuthenticatorIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="12" r="1.5" fill="#111827" />
      <Circle cx="12" cy="12" r="1.5" fill="#111827" />
      <Circle cx="18" cy="12" r="1.5" fill="#111827" />
    </Svg>
  );
}

export function CloseIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
