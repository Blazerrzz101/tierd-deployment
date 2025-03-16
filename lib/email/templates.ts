export const welcomeEmailTemplate = (username: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 8px; }
    .footer { text-align: center; padding: 20px 0; color: #666; font-size: 12px; }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #ff4b26;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Tier'd! 🎮</h1>
    </div>
    <div class="content">
      <p>Hey ${username}!</p>
      <p>Welcome to Tier'd - your new home for discovering and ranking the best gaming gear!</p>
      <p>Here's what you can do now:</p>
      <ul>
        <li>Vote on your favorite gaming products</li>
        <li>Join discussions with other gamers</li>
        <li>Create and share your gaming setup</li>
        <li>Track your voting history and contributions</li>
      </ul>
      <a href="https://tierd.gg/getting-started" class="button">Get Started</a>
      <p>If you have any questions, just reply to this email - we're here to help!</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Tier'd. All rights reserved.</p>
      <p>You're receiving this email because you signed up for Tier'd.</p>
    </div>
  </div>
</body>
</html>
`

export const profileUpdateTemplate = (username: string, changes: string[]) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Same styles as above */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Profile Updated</h1>
    </div>
    <div class="content">
      <p>Hi ${username},</p>
      <p>Your Tier'd profile has been updated with the following changes:</p>
      <ul>
        ${changes.map(change => `<li>${change}</li>`).join('')}
      </ul>
      <a href="https://tierd.gg/profile" class="button">View Your Profile</a>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Tier'd. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
` 