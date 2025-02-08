export async function GET(request) {
    return new Response(
      JSON.stringify({
        activityLog: [
          { message: "Logged in successfully" },
          { message: "Viewed a product" },
          { message: "Voted on a product" }
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
  