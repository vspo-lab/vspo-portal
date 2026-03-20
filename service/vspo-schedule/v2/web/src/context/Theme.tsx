import CssBaseline from "@mui/material/CssBaseline";
import {
  type ColorSystemOptions,
  createTheme,
  ThemeProvider,
} from "@mui/material/styles";

type ThemeProviderProps = {
  children: React.ReactNode;
};

const lightColorSystem: ColorSystemOptions = {
  palette: {
    customColors: {
      vspoPurple: "#7266cf",
      darkBlue: "rgb(45, 75, 112)",
      gray: "#353535",
      darkGray: "#212121",
      videoHighlight: {
        live: "#E53935",
        upcoming: "#2D4870",
        trending: "#E53935",
      },
      status: {
        success: "#43A047",
        warning: "#FB8C00",
        info: "#1E88E5",
      },
    },
  },
};

const darkColorSystem: ColorSystemOptions = {
  palette: {
    customColors: {
      vspoPurple: "#7266cf",
      darkBlue: "rgb(45, 75, 112)",
      gray: "#353535",
      darkGray: "#212121",
      videoHighlight: {
        live: "#FF5252",
        upcoming: "#5C8DBE",
        trending: "#FF5252",
      },
      status: {
        success: "#66BB6A",
        warning: "#FFA726",
        info: "#42A5F5",
      },
    },
  },
};

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: "class",
  },
  colorSchemes: {
    light: lightColorSystem,
    dark: darkColorSystem,
  },
  typography: {
    fontFamily:
      '"Noto Sans JP", "Hiragino Kaku Gothic Pro", "ヒラギノ角ゴ Pro", system-ui, sans-serif',
    body1: { fontSize: "0.875rem", lineHeight: 1.5 },
    body2: { fontSize: "0.8rem", lineHeight: 1.4 },
    caption: { fontSize: "0.75rem", lineHeight: 1.4 },
    h4: {
      fontFamily: '"M PLUS Rounded 1c", "Noto Sans JP", sans-serif',
      fontWeight: 700,
    },
    h5: {
      fontFamily: '"M PLUS Rounded 1c", "Noto Sans JP", sans-serif',
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontFamily: '"M PLUS Rounded 1c", "Noto Sans JP", sans-serif',
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
  },
  mixins: {
    scrollbar: {
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": {
        display: "none",
      },
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: ({ mixins }) => ({
        html: mixins.scrollbar,
        body: mixins.scrollbar,
      }),
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => theme.mixins.scrollbar,
      },
    },
  },
});

export const ThemeModeProvider: React.FC<ThemeProviderProps> = ({
  children,
}) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};
