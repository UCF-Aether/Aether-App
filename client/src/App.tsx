// import logo from "./logo.svg";
import { createTheme, LinkProps as MuiLinkProps, ThemeProvider } from "@mui/material";
import { forwardRef, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { Link, LinkProps, Route, Routes } from "react-router-dom";
import "./App.css";
import { ColorModeContext } from "./components/ColorModeContext";
import { DeviceDetailsModal } from "./components/DeviceDetailsModal";
import { GatewayDetailsModal } from "./components/GatewayDetailsModal";
import { SupabaseProvider } from "./components/SupabaseContext";
import { LoginSignup } from "./pages/LoginSignup";
import { MainPage } from "./pages/Main";
import { Dashboard } from "./pages/Dashboard";
import { Overview } from "./pages/dashboard/Overview";
import { Devices } from "./pages/dashboard/Devices";
import { Gateways } from "./pages/dashboard/Gateways";
import { Alerts } from "./pages/dashboard/Alerts";
import { Account } from "./pages/dashboard/Account";
import { RequireAuth } from "./components/RequireAuth";
import { supabase } from "./supabaseClient";
import { AlertModal } from "./components/AlertModal";
import { NewAlertModal } from "./components/NewAlertModal";
import { NewDeviceModal } from "./components/NewDeviceModal";

console.log(supabase);


const queryClient = new QueryClient();

// https://github.com/mui/material-ui/issues/29942
const LinkBehavior = forwardRef<any, Omit<LinkProps, "to"> & { href: LinkProps["to"] }>(
  (props, ref) => {
    const { href, ...other } = props;
    // Map href (MUI) -> to (react-router)
    return <Link ref={ref} to={href} {...other} />;
  }
);
LinkBehavior.displayName = "LinkBehavior";

const colors = {
  linkBlue: "#2C73FF",
};
const linkTheme = createTheme({
  components: {
    MuiButtonBase: {
      defaultProps: {
        LinkComponent: LinkBehavior,
      },
    },
    MuiLink: {
      defaultProps: {
        color: colors.linkBlue,
        component: LinkBehavior,
      } as MuiLinkProps, // https://github.com/mui/material-ui/issues/29942
    },
  },
});

export default function App() {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
      },
    }),
    []
  );

  const colorModeTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
        components: {
          MuiDrawer: {
            styleOverrides: {
              paper: {
                backgroundColor: '#F8F9FB',
              },
            }
          }
        }
      }),
    [mode]
  );

  const Clients = (props: { children?: JSX.Element[] | JSX.Element }) => {
    return (
      <SupabaseProvider supabaseClient={supabase}>
        <QueryClientProvider client={queryClient}>
          {props.children}
        </QueryClientProvider>
      </SupabaseProvider>
    );
  }

  const Providers = (props: { children?: JSX.Element[] | JSX.Element }) => {
    return (
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={linkTheme}>
          <ThemeProvider theme={colorModeTheme}>
            {props.children}
          </ThemeProvider>
        </ThemeProvider>
      </ColorModeContext.Provider>
    );
  }

  return (
    <Clients>
      <Providers>
        <div className="App">
          <Routes>
            <Route path="/*" element={<MainPage />}>
              <Route path="device/:deviceId" element={<DeviceDetailsModal />} />
              <Route path="gateway/:gatewayId" element={<GatewayDetailsModal />} />
            </Route>
            <Route path="/auth" element={<LoginSignup />} />
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>}>
              <Route index element={<Overview />} />
              <Route path='devices' element={<Devices />} >
                <Route path='new' element={<NewDeviceModal />} />
                <Route path=':deviceId' element={<DeviceDetailsModal />} />
              </Route>
              <Route path='gateways' element={<Gateways />} />
              <Route path='alerts' element={<Alerts />}>
                <Route path=':alertId' element={<AlertModal />} />
                <Route path='new' element={<NewAlertModal />} />
              </Route>
              <Route path='account' element={<Account />} />
            </Route>
          </Routes>
        </div>
      </Providers>
    </Clients>
  );
}
