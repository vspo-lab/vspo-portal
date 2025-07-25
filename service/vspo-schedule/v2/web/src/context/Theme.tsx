import CssBaseline from "@mui/material/CssBaseline";
import {
  type ColorSystemOptions,
  createTheme,
  ThemeProvider,
} from "@mui/material/styles";

type ThemeProviderProps = {
  children: React.ReactNode;
};

const sharedColorSystemOptions: ColorSystemOptions = {
  palette: {
    customColors: {
      vspoPurple: "#7266cf",
      darkBlue: "rgb(45, 75, 112)",
      gray: "#353535",
      darkGray: "#212121",
      videoHighlight: {
        live: "red",
        upcoming: "rgb(45, 75, 112)",
        trending: "red",
      },
    },
  },
};

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: "class",
  },
  colorSchemes: {
    light: sharedColorSystemOptions,
    dark: sharedColorSystemOptions,
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
