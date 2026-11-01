export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        '2xs': '0 0.5px 1px 0 rgb(0 0 0 / 0.02)',
      },
    },
  },
  plugins: [],
};
