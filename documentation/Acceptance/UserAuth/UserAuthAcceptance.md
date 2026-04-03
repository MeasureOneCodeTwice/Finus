# Acceptance Criteria

## 1: Use of app on any of my device
- Users can create an account with an email and password
- User data is associated with an account under a certain name
- User can log into their account from mutliple supported devices (Desktop only)
- User can log out of their account and log in with a different accout on the same machine 

---

# Acceptance Test

## 1: Creating mutliple finus accounts
1. Click on sign up
2. Fill out the form, age being 21 and over, email following name@domain.com format, password being at least 8 characters long, including at least both a number and a letter/symbol. 
3. Click on create account 
4. Should be sent to dashboard page if account creation was a success.
5. Check dashboard displays hello [name] matches the name entered when creating an account 
6. Use another device or open incognito tab and try to login into the account that was just created
7. Click on button on top left of the screen and then click on signout, should be sent back to the login page.
8. Repeat steps 1-5 and see if user is able to create and login into another account

## 2: Login into same finus accounts from different devices
1. Create a finus accounts if not already created
2. login into the finus account
3. Use a different device or open a incognito tab to login into the same account
4. Check if both devices are stilled logged into the account and shows the same info on screen.
