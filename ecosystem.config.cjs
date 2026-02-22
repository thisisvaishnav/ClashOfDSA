module.exports = {
  apps: [
    {
      name: "web",
      cwd: "./apps/web/.next/standalone",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "battle-engine",
      cwd: "./apps/battle-engine",
      script: "dist/index.js",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "worker",
      cwd: "./apps/worker",
      script: "dist/index.js",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
