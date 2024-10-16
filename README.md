# Pass Gen
## Features
- Automatic password generation
- Doesn't store passwords hence no leaks
- Generates from a PIN that you can reuse
- Indirectly protects you from phishing

Remembering passwords is hard. This is a simple password generator that can be used to generate passwords for you.

## Usage Demo

#### Main UI
![Screenshot 2024-10-16 143147](https://github.com/user-attachments/assets/ddd6c249-65bb-4a14-b04c-ee885f6b746c)
#### Generating Password
![Screenshot 2024-10-16 143224](https://github.com/user-attachments/assets/f810a464-ad4a-4db0-bb96-b29fe4b9a194)
#### Password UI
![Screenshot 2024-10-16 143233](https://github.com/user-attachments/assets/7bc17656-0df3-49f1-b848-f2fa6746fe0f)

#### Working
- The `%d` seed is a default seed which is the website domain (you don't need to enter it)
- If your account is in GitHub, `%d` translates to `www.github.com`
- You only need to remember the PIN
- For the same website given your PIN, the extension generates the exact same password
- No information is saved about you or the website and password is calculated on the fly
- In the demo above I'm at `www.github.com`, and the PIN is `12345678`, hence the password is `62a6dC@31Cf8`

Additionally, if you're visiting a phishing website, the password generated will be different from the one you use on the original website (coz of differences in the domain name). As a result you will be saved from giving away your real password.

## How it Works
Unlike other password generators, this one **DOES NOT** generate random passwords.
Instead, you need to enter a `seed` which is a word or phrase, and you need to enter an `iter` which is a **PIN** number that only you can remember.
The password is generated by hashing the `seed` and `iter` together.
You'll need to remember the `seed` and `iter` to generate the same password again.
This implementation provides a special string combo `%d` which fills in the domain name of the site when this implementation is used as a chrome extension.
Slight changes to the `seed` or `iter` will result in a completely different password as the generator uses `SHA256`.
