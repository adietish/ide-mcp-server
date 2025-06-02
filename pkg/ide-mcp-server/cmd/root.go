package cmd

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"os"
	"strconv"

	"github.com/adietish/ide-mcp-server/pkg/mcp"
	"github.com/adietish/ide-mcp-server/pkg/version"
	"github.com/mark3labs/mcp-go/server"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"k8s.io/klog/v2"
	"k8s.io/klog/v2/textlogger"
)

var rootCmd = &cobra.Command{
	Use:   "ide-mcp-server [command] [options]",
	Short: "IDE Model Context Protocol (MCP) server",
	Long: `
IDE Model Context Protocol (MCP) server

  # show this help
  ide-mcp-server -h

  # shows version information
  ide-mcp-server --version

  # start STDIO server
  ide-mcp-server

  # start a SSE server on port 8080
  ide-mcp-server --sse-port 8080

  # start a SSE server on port 8443 with a public HTTPS host of example.com
  ide-mcp-server --sse-port 8443 --sse-base-url https://example.com:8443
  `,
	Run: func(cmd *cobra.Command, args []string) {
		initLogging()
		klog.V(5).Infof("Starting ide-mcp-server")
		if viper.GetBool("version") {
			fmt.Println(version.Version)
			return
		}
		mcpServer, err := mcp.NewSever()
		if err != nil {
			fmt.Printf("Failed to initialize MCP server: %v\n", err)
			os.Exit(1)
		}
		var sseServer *server.SSEServer
		if ssePort := viper.GetInt("sse-port"); ssePort > 0 {
			sseServer = mcpServer.ServeSse(viper.GetString("sse-base-url"))
			defer func() { _ = sseServer.Shutdown(cmd.Context()) }()
			klog.V(0).Infof("SSE server starting on port %d", ssePort)
			if err := sseServer.Start(fmt.Sprintf(":%d", ssePort)); err != nil {
				klog.Errorf("Failed to start SSE server: %s", err)
				return
			}
		}
		if err := mcpServer.ServeStdio(); err != nil && !errors.Is(err, context.Canceled) {
			panic(err)
		}
	},
}

func initLogging() {
	flagSet := flag.NewFlagSet("kubernetes-mcp-server", flag.ContinueOnError)
	klog.InitFlags(flagSet)
	loggerOptions := []textlogger.ConfigOption{textlogger.Output(os.Stdout)}
	if logLevel := viper.GetInt("log-level"); logLevel >= 0 {
		loggerOptions = append(loggerOptions, textlogger.Verbosity(logLevel))
		_ = flagSet.Parse([]string{"--v", strconv.Itoa(logLevel)})
	}
	logger := textlogger.NewLogger(textlogger.NewConfig(loggerOptions...))
	klog.SetLoggerWithOptions(logger)
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		klog.Errorf("Failed to execute command: %s", err)
		os.Exit(1)
	}
}
