"use client";

/* eslint-disable @typescript-eslint/no-explicit-any --
   The "Segnale" design system components below are vendored plain JS/JSX (see the source
   material under `AI sales/`): every prop is read off `props` with a runtime default rather
   than a TS type, so props without a default (style, children, title, ...) get inferred by
   TS as *required*. Re-exporting each one typed as ComponentType<any> here, in one place,
   keeps the vendored files untouched while giving consumers the loose/optional props they
   actually have at runtime. */
import type { ComponentType } from "react";

import { Button as ButtonImpl } from "./core/Button.jsx";
import { Badge as BadgeImpl } from "./core/Badge.jsx";
import { Card as CardImpl } from "./core/Card.jsx";
import { Checkbox as CheckboxImpl } from "./core/Checkbox.jsx";
import { Dialog as DialogImpl } from "./core/Dialog.jsx";
import { Icon as IconImpl } from "./core/Icon.jsx";
import { IconButton as IconButtonImpl } from "./core/IconButton.jsx";
import { Input as InputImpl } from "./core/Input.jsx";
import { SegmentedControl as SegmentedControlImpl } from "./core/SegmentedControl.jsx";
import { Select as SelectImpl } from "./core/Select.jsx";
import { Switch as SwitchImpl } from "./core/Switch.jsx";
import { Tabs as TabsImpl } from "./core/Tabs.jsx";
import { Tooltip as TooltipImpl } from "./core/Tooltip.jsx";

import { BarChart as BarChartImpl } from "./charts/BarChart.jsx";
import { LineChart as LineChartImpl } from "./charts/LineChart.jsx";
import { Sparkline as SparklineImpl } from "./charts/Sparkline.jsx";
import { PieChart as PieChartImpl } from "./charts/PieChart.jsx";

import { DataTable as DataTableImpl } from "./data/DataTable.jsx";
import { Delta as DeltaImpl } from "./data/Delta.jsx";
import { Metric as MetricImpl } from "./data/Metric.jsx";
import { ProgressBar as ProgressBarImpl } from "./data/ProgressBar.jsx";
import { CircularProgress as CircularProgressImpl } from "./data/CircularProgress.jsx";

import { Sidebar as SidebarImpl } from "./navigation/Sidebar.jsx";

export const Button: ComponentType<any> = ButtonImpl;
export const Badge: ComponentType<any> = BadgeImpl;
export const Card: ComponentType<any> = CardImpl;
export const Checkbox: ComponentType<any> = CheckboxImpl;
export const Dialog: ComponentType<any> = DialogImpl;
export const Icon: ComponentType<any> = IconImpl;
export const IconButton: ComponentType<any> = IconButtonImpl;
export const Input: ComponentType<any> = InputImpl;
export const SegmentedControl: ComponentType<any> = SegmentedControlImpl;
export const Select: ComponentType<any> = SelectImpl;
export const Switch: ComponentType<any> = SwitchImpl;
export const Tabs: ComponentType<any> = TabsImpl;
export const Tooltip: ComponentType<any> = TooltipImpl;

export const BarChart: ComponentType<any> = BarChartImpl;
export const LineChart: ComponentType<any> = LineChartImpl;
export const Sparkline: ComponentType<any> = SparklineImpl;
export const PieChart: ComponentType<any> = PieChartImpl;

export const DataTable: ComponentType<any> = DataTableImpl;
export const Delta: ComponentType<any> = DeltaImpl;
export const Metric: ComponentType<any> = MetricImpl;
export const ProgressBar: ComponentType<any> = ProgressBarImpl;
export const CircularProgress: ComponentType<any> = CircularProgressImpl;

export const Sidebar: ComponentType<any> = SidebarImpl;
