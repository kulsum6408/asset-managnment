const bcrypt = require("bcrypt");
const UserModel = require("./models/userModel");

async function test() {
  try {
    const email = "assetofficer@assets.com";
    const password = "Asset@12345";

    console.log("Testing with UserModel.getByEmail()...");

    const user = await UserModel.getByEmail(email);

    if (!user) {
      console.log("❌ UserModel could not find the user.");
      return;
    }

    console.log("✅ User found");
    console.log("User ID:", user.user_id);
    console.log("Email:", user.email);
    console.log("Role:", user.role);
    console.log("is_active:", user.is_active);
    console.log("Password hash length:", user.password?.length);

    const match = await bcrypt.compare(
      password,
      user.password
    );

    console.log(
      "Password matches:",
      match
    );

    if (user.is_active === 0) {
      console.log("❌ Account is inactive.");
    }

    if (match && user.is_active !== 0) {
      console.log("✅ Backend login data is valid.");
    }
  } catch (error) {
    console.error("❌ TEST ERROR:", error);
  } finally {
    process.exit();
  }
}

test();