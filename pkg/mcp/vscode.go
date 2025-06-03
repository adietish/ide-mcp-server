package mcp

import (
	"context"
	"net"
	"strings"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
	"k8s.io/klog/v2"
)

func (s *Server) initVScode() []server.ServerTool {
	return []server.ServerTool{
		{
			Tool: mcp.NewTool("open_editor",
				mcp.WithDescription("Opens an editor with the specified file path"),
				mcp.WithString("filePath", mcp.Description("file to open in the editor"), mcp.Required()),
			),
			Handler: s.openEditor,
		},
	}
}

func (s *Server) openEditor(_ context.Context, ctr mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	filePath, ok := ctr.Params.Arguments.(map[string]string)["filePath"]
	if !ok {
		return &mcp.CallToolResult{
			IsError: true,
			Content: []mcp.Content{
				mcp.TextContent{
					Type: "text",
					Text: "Invalid arguments format",
				},
			},
		}, nil
	}
	return &mcp.CallToolResult{
			IsError: false,
			Content: []mcp.Content{
				mcp.TextContent{
					Type: "text",
					Text: "Opened editor for " + filePath,
				},
			},
		},
		nil
}

func (s *Server) send(command string, params ...string) {
	con, err := net.Dial("tcp", "localhost:12345")
	if err != nil {
		klog.Fatal(err)
	}
	defer con.Close()

	allParams := []string{command}
	allParams = append(allParams, params...)
	joined := strings.Join(allParams, "")
	_, err = con.Write([]byte(joined))
	if err != nil {
		klog.Fatal(err)
	}
}
