import AddIcon from "@mui/icons-material/Add";
import ErrorIcon from "@mui/icons-material/Error";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Box,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  IconButton,
  List,
  Stack,
  Switch,
} from "@mui/material";
import { useCallback } from "react";
import { useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import { Device, useDevices } from "../../hooks/devices";
import { NodeListItem as Item } from "../NodeListItem";

export interface DevicePanelContentProps {
  showDevices: boolean;
  onShowDevicesChange: () => void;
  onDeviceClick?: (device: Device) => void;
}

export function DevicePanelContent(props: DevicePanelContentProps) {
  const { showDevices, onShowDevicesChange, onDeviceClick } = props;
  const navigate = useNavigate();
  const { devices, isLoading, isError, refetch } = useDevices();
  const client = useQueryClient();

  const handleRefresh = useCallback(() => {
    refetch();
  }, [client]);

  const handleNew = useCallback(() => {
    navigate("device/new");
  }, []);

  const handleDeviceClick = useCallback((device: Device) => {
    navigate("device/" + device.device_id)
  }, [onDeviceClick, navigate]);

  if (isError) return <ErrorIcon color="error" />;
  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Stack direction="row">
        <IconButton onClick={handleRefresh}>
          <RefreshIcon />
        </IconButton>
        <IconButton onClick={handleNew}>
          <AddIcon />
        </IconButton>
        <FormGroup>
          <FormControlLabel
            control={<Switch checked={showDevices} onChange={onShowDevicesChange} />}
            label="Show"
          />
        </FormGroup>
      </Stack>
      <List
        dense
        sx={{
          listStylePosition: "inside",
          height: "35vh",
          display: "block",
          overflow: "auto",
        }}
      >
        {(devices ?? []).map((d) => (
          <Item
            primary={d.name}
            key={d.device_id}
            onClick={() => handleDeviceClick(d)}
          />
        ))}
      </List>
    </Box>
  );
}
