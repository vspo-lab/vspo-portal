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
