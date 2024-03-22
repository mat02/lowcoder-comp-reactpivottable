import config from "lowcoder-cli/config/vite.config";
export default {
  ...config,
  server: {
    open: false,
    port: 9000,
    host: true,
  },
};
