"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Activity, TrendingUp, DollarSign, Users, Download, Settings, PlayCircle, PauseCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

const getCountryFlag = (countryCode: string): string => {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

type Lead = {
  id: string
  timestamp: Date
  subId: string
  clickId: string
  country: string
  payout: number
  status: "pending" | "approved" | "rejected"
  offer: string
}

type Click = {
  id: string
  timestamp: Date
  subId: string
  country: string
  userAgent: string
  ip: string
}

type Stats = {
  totalClicks: number
  totalLeads: number
  totalRevenue: number
  conversionRate: number
  approvedLeads: number
  pendingLeads: number
  rejectedLeads: number
}

type ClickDealerConfig = {
  apiKey: string
  affiliateId: string
  apiEndpoint: string
}

export default function CPADashboard() {
  const [clicks, setClicks] = useState<Click[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<Stats>({
    totalClicks: 0,
    totalLeads: 0,
    totalRevenue: 0,
    conversionRate: 0,
    approvedLeads: 0,
    pendingLeads: 0,
    rejectedLeads: 0,
  })
  const [selectedSubId, setSelectedSubId] = useState<string>("all")
  const [isLive, setIsLive] = useState(false)

  const [showSettings, setShowSettings] = useState(false)
  const [config, setConfig] = useState<ClickDealerConfig>({
    apiKey: "",
    affiliateId: "",
    apiEndpoint: "https://api.clickdealer.com/api/v1",
  })
  const [isConfigured, setIsConfigured] = useState(false)
  const [apiError, setApiError] = useState<string>("")
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    const savedConfig = localStorage.getItem("clickdealer_config")
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig)
      setConfig(parsed)
      setIsConfigured(true)
    }
  }, [])

  const saveConfiguration = () => {
    if (!config.apiKey || !config.affiliateId) {
      setApiError("Please fill in all required fields")
      return
    }

    localStorage.setItem("clickdealer_config", JSON.stringify(config))
    setIsConfigured(true)
    setShowSettings(false)
    setApiError("")

    fetchClickDealerData()
  }

  const fetchClickDealerData = async () => {
    if (!isConfigured || !config.apiKey) return

    try {
      setApiError("")

      // Fetch conversions/leads from ClickDealer
      const leadsResponse = await fetch(`${config.apiEndpoint}/conversions`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!leadsResponse.ok) {
        throw new Error(`API Error: ${leadsResponse.status}`)
      }

      const leadsData = await leadsResponse.json()

      // Transform ClickDealer data to our format
      const transformedLeads: Lead[] =
        leadsData.conversions?.map((conv: any) => ({
          id: conv.conversion_id || conv.id,
          timestamp: new Date(conv.timestamp || conv.created_at),
          subId: conv.sub_id || conv.sub1 || "N/A",
          clickId: conv.click_id,
          country: conv.country || "Unknown",
          payout: Number.parseFloat(conv.payout || conv.revenue || 0),
          status: conv.status === "approved" ? "approved" : conv.status === "rejected" ? "rejected" : "pending",
          offer: conv.offer_name || conv.campaign_name || "Unknown Offer",
        })) || []

      // Fetch clicks from ClickDealer
      const clicksResponse = await fetch(`${config.apiEndpoint}/clicks`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (clicksResponse.ok) {
        const clicksData = await clicksResponse.json()

        const transformedClicks: Click[] =
          clicksData.clicks?.map((click: any) => ({
            id: click.click_id || click.id,
            timestamp: new Date(click.timestamp || click.created_at),
            subId: click.sub_id || click.sub1 || "N/A",
            country: click.country || "Unknown",
            userAgent: click.user_agent || "Unknown",
            ip: click.ip_address || click.ip || "0.0.0.0",
          })) || []

        setClicks(transformedClicks)
      }

      setLeads(transformedLeads)
      setLastSync(new Date())
    } catch (error) {
      console.error("[v0] ClickDealer API Error:", error)
      setApiError(error instanceof Error ? error.message : "Failed to fetch data from ClickDealer")
    }
  }

  useEffect(() => {
    if (!isLive || !isConfigured) return

    fetchClickDealerData()

    const interval = setInterval(() => {
      fetchClickDealerData()
    }, 30000)

    return () => clearInterval(interval)
  }, [isLive, isConfigured, config])

  // Calculate statistics
  useEffect(() => {
    const filteredClicks = selectedSubId === "all" ? clicks : clicks.filter((c) => c.subId === selectedSubId)
    const filteredLeads = selectedSubId === "all" ? leads : leads.filter((l) => l.subId === selectedSubId)

    const approvedLeads = filteredLeads.filter((l) => l.status === "approved").length
    const pendingLeads = filteredLeads.filter((l) => l.status === "pending").length
    const rejectedLeads = filteredLeads.filter((l) => l.status === "rejected").length
    const totalRevenue = filteredLeads
      .filter((l) => l.status === "approved")
      .reduce((sum, lead) => sum + lead.payout, 0)
    const conversionRate = filteredClicks.length > 0 ? (filteredLeads.length / filteredClicks.length) * 100 : 0

    setStats({
      totalClicks: filteredClicks.length,
      totalLeads: filteredLeads.length,
      totalRevenue,
      conversionRate,
      approvedLeads,
      pendingLeads,
      rejectedLeads,
    })
  }, [clicks, leads, selectedSubId])

  const subIds = Array.from(new Set([...clicks.map((c) => c.subId), ...leads.map((l) => l.subId)]))

  const subIdReport = subIds
    .map((subId) => {
      const subClicks = clicks.filter((c) => c.subId === subId)
      const subLeads = leads.filter((l) => l.subId === subId)
      const approvedSubLeads = subLeads.filter((l) => l.status === "approved")
      const revenue = approvedSubLeads.reduce((sum, lead) => sum + lead.payout, 0)
      const cr = subClicks.length > 0 ? (subLeads.length / subClicks.length) * 100 : 0

      return {
        subId,
        clicks: subClicks.length,
        leads: subLeads.length,
        approved: approvedSubLeads.length,
        revenue,
        conversionRate: cr,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)

  const exportToCSV = () => {
    const headers = ["Sub ID", "Clicks", "Leads", "Approved", "Revenue", "CR%"]
    const rows = subIdReport.map((row) => [
      row.subId,
      row.clicks,
      row.leads,
      row.approved,
      `$${row.revenue.toFixed(2)}`,
      `${row.conversionRate.toFixed(2)}%`,
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `clickdealer-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ClickDealer Dashboard</h1>
            <p className="text-muted-foreground">Real-time tracking from ClickDealer API</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)} className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>

            <Button
              variant={isLive ? "default" : "outline"}
              size="sm"
              onClick={() => setIsLive(!isLive)}
              disabled={!isConfigured}
              className="gap-2"
            >
              {isLive ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
              {isLive ? "Live" : "Paused"}
            </Button>

            <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {showSettings && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle>ClickDealer API Configuration</CardTitle>
              <CardDescription>
                Configure your ClickDealer API credentials to start tracking real-time data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key *</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your ClickDealer API key"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Get your API key from ClickDealer Dashboard → Tools → API
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="affiliateId">Affiliate ID *</Label>
                <Input
                  id="affiliateId"
                  placeholder="Enter your Affiliate ID"
                  value={config.affiliateId}
                  onChange={(e) => setConfig({ ...config, affiliateId: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiEndpoint">API Endpoint</Label>
                <Input
                  id="apiEndpoint"
                  placeholder="API endpoint URL"
                  value={config.apiEndpoint}
                  onChange={(e) => setConfig({ ...config, apiEndpoint: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Default: https://api.clickdealer.com/api/v1</p>
              </div>

              {apiError && (
                <Alert variant="destructive">
                  <span className="text-lg mr-2">{getCountryFlag("US")}</span>
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button onClick={saveConfiguration} className="flex-1">
                  Save & Connect
                </Button>
                <Button variant="outline" onClick={() => setShowSettings(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isConfigured && !showSettings && (
          <Alert>
            <span className="text-lg mr-2">{getCountryFlag("US")}</span>
            <AlertDescription>
              Please configure your ClickDealer API credentials to start tracking data.
              <Button variant="link" className="px-2" onClick={() => setShowSettings(true)}>
                Click here to configure
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {lastSync && (
          <div className="text-xs text-muted-foreground text-right">Last synced: {lastSync.toLocaleString()}</div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {isLive && isConfigured && <span className="text-green-500">● Live from ClickDealer</span>}
                {!isConfigured && <span className="text-orange-500">● Not configured</span>}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeads.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">{stats.approvedLeads} approved</span>
                {" • "}
                <span className="text-yellow-500">{stats.pendingLeads} pending</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">From approved leads only</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">Leads / Clicks ratio</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clicks">Real-time Clicks</TabsTrigger>
            <TabsTrigger value="leads">Real-time Leads</TabsTrigger>
            <TabsTrigger value="subid-report">Sub ID Report</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Clicks</CardTitle>
                  <CardDescription>Latest 5 clicks from ClickDealer</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {clicks.slice(0, 5).map((click) => (
                      <div key={click.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{click.subId}</p>
                          <p className="text-xs text-muted-foreground">
                            {click.country} • {click.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge variant="outline">Click</Badge>
                      </div>
                    ))}
                    {clicks.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        {isConfigured ? "Waiting for clicks..." : "Configure API to see data"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Leads</CardTitle>
                  <CardDescription>Latest 5 leads with payout</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leads.slice(0, 5).map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{lead.subId}</p>
                          <p className="text-xs text-muted-foreground">
                            {lead.offer} • ${lead.payout}
                          </p>
                        </div>
                        <Badge
                          variant={
                            lead.status === "approved"
                              ? "default"
                              : lead.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {lead.status}
                        </Badge>
                      </div>
                    ))}
                    {leads.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        {isConfigured ? "Waiting for leads..." : "Configure API to see data"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clicks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Clicks</CardTitle>
                <CardDescription>Latest clicks tracked in real-time</CardDescription>
              </CardHeader>
              <CardContent>
                {clicks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No clicks yet. Waiting for traffic...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Click ID</TableHead>
                        <TableHead>Sub ID</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clicks.map((click) => (
                        <TableRow key={click.id}>
                          <TableCell className="font-medium">{click.timestamp.toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-xs">{click.id}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{click.subId}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-lg mr-2">{getCountryFlag(click.country)}</span>
                            {click.country}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{click.ip}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>Conversions tracked with payout information</CardDescription>
              </CardHeader>
              <CardContent>
                {leads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No leads yet. Keep driving traffic...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Lead ID</TableHead>
                        <TableHead>Sub ID</TableHead>
                        <TableHead>Offer</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Payout</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.timestamp.toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-xs">{lead.id}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{lead.subId}</Badge>
                          </TableCell>
                          <TableCell>{lead.offer}</TableCell>
                          <TableCell>
                            <span className="text-lg mr-2">{getCountryFlag(lead.country)}</span>
                            {lead.country}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">${lead.payout.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                lead.status === "approved"
                                  ? "default"
                                  : lead.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {lead.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subid-report">
            <Card>
              <CardHeader>
                <CardTitle>Sub ID Performance Report</CardTitle>
                <CardDescription>Detailed breakdown by Sub ID with revenue tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sub ID</TableHead>
                        <TableHead className="text-right">Clicks</TableHead>
                        <TableHead className="text-right">Leads</TableHead>
                        <TableHead className="text-right">Approved</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">CR%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subIdReport.map((row) => (
                        <TableRow key={row.subId}>
                          <TableCell className="font-medium">
                            <Badge>{row.subId}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{row.clicks}</TableCell>
                          <TableCell className="text-right">{row.leads}</TableCell>
                          <TableCell className="text-right text-green-600">{row.approved}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            ${row.revenue.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={row.conversionRate > 5 ? "default" : "secondary"}>
                              {row.conversionRate.toFixed(2)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {subIdReport.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      {isConfigured ? "No data yet. Start generating traffic." : "Configure API first"}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
