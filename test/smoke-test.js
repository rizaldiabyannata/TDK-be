const smokeTest = async () => {
  const url = "http://localhost:5000/api/runtime";
  const retries = 5;
  const interval = 2000; // 2 seconds

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[Attempt ${i + 1}/${retries}] Pinging ${url}...`);
      const response = await fetch(url);

      if (response.status === 200) {
        console.log("✅ Smoke test passed! The application is running correctly.");
        process.exit(0);
      } else {
        console.warn(`⚠️ Received status code ${response.status}. Retrying...`);
      }
    } catch (error) {
      console.warn(`🚨 Connection failed: ${error.message}. Retrying...`);
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  console.error("❌ Smoke test failed. The application did not respond correctly after multiple attempts.");
  process.exit(1);
};

smokeTest();
