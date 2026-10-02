import React, { useMemo } from "react";
import HeatMap from "@uiw/react-heat-map";

// Colour steps: a day with 0 activity is dark, more activity is greener
const panelColors = {
  0: "#1e293b",
  1: "#0e4429",
  2: "#006d32",
  4: "#26a641",
  6: "#39d353",
};

const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}/${String(x.getMonth() + 1).padStart(2, "0")}/${String(
    x.getDate()
  ).padStart(2, "0")}`;
};

// `repositories` = the user's repos; each creation/update day counts as activity
const HeatMapProfile = ({ repositories = [] }) => {
  const { data, start, end } = useMemo(() => {
    const counts = {};
    repositories.forEach((repo) => {
      [repo.createdAt, repo.updatedAt].forEach((d) => {
        if (!d) return;
        const key = dayKey(d);
        counts[key] = (counts[key] || 0) + 1;
      });
    });

    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);

    return {
      data: Object.entries(counts).map(([date, count]) => ({ date, count })),
      start: startDate,
      end: endDate,
    };
  }, [repositories]);

  return (
    <HeatMap
      style={{ maxWidth: "760px", color: "#94a3b8" }}
      value={data}
      startDate={start}
      endDate={end}
      weekLabels={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}
      rectSize={13}
      space={3}
      rectProps={{ rx: 2.5 }}
      panelColors={panelColors}
    />
  );
};

export default HeatMapProfile;
