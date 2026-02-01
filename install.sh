#!/bin/sh
# mdview installer script
# Usage: curl -fsSL https://raw.githubusercontent.com/tzachbon/mdview/main/install.sh | sh
#
# Options:
#   -b, --bin-dir DIR   Installation directory (default: /usr/local/bin)
#   -v, --version VER   Install specific version (default: latest)
#   -h, --help          Show this help message

set -e

REPO="tzachbon/mdview"
BIN_NAME="mdview"
DEFAULT_BIN_DIR="/usr/local/bin"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info() {
    printf "${GREEN}info${NC}: %s\n" "$1"
}

warn() {
    printf "${YELLOW}warn${NC}: %s\n" "$1"
}

error() {
    printf "${RED}error${NC}: %s\n" "$1" >&2
    exit 1
}

usage() {
    cat <<EOF
mdview installer

Usage: install.sh [OPTIONS]

Options:
    -b, --bin-dir DIR   Installation directory (default: /usr/local/bin)
    -v, --version VER   Install specific version (default: latest)
    -h, --help          Show this help message

Examples:
    # Install latest version to /usr/local/bin
    curl -fsSL https://raw.githubusercontent.com/tzachbon/mdview/main/install.sh | sh

    # Install to custom directory
    curl -fsSL https://raw.githubusercontent.com/tzachbon/mdview/main/install.sh | sh -s -- -b ~/.local/bin

    # Install specific version
    curl -fsSL https://raw.githubusercontent.com/tzachbon/mdview/main/install.sh | sh -s -- -v v1.0.0
EOF
}

detect_platform() {
    local os arch

    os=$(uname -s | tr '[:upper:]' '[:lower:]')
    arch=$(uname -m)

    case "$os" in
        darwin)
            os="darwin"
            ;;
        linux)
            os="linux"
            ;;
        mingw*|msys*|cygwin*)
            os="windows"
            ;;
        *)
            error "Unsupported operating system: $os"
            ;;
    esac

    case "$arch" in
        x86_64|amd64)
            arch="x64"
            ;;
        arm64|aarch64)
            arch="arm64"
            ;;
        *)
            error "Unsupported architecture: $arch"
            ;;
    esac

    echo "${os}-${arch}"
}

get_latest_version() {
    local url="https://api.github.com/repos/${REPO}/releases/latest"
    local version

    if command -v curl >/dev/null 2>&1; then
        version=$(curl -fsSL "$url" | grep '"tag_name"' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/')
    elif command -v wget >/dev/null 2>&1; then
        version=$(wget -qO- "$url" | grep '"tag_name"' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/')
    else
        error "Neither curl nor wget found. Please install one of them."
    fi

    if [ -z "$version" ]; then
        error "Failed to fetch latest version. Check your internet connection or specify a version with -v."
    fi

    echo "$version"
}

download_binary() {
    local version="$1"
    local platform="$2"
    local dest="$3"

    local ext=""
    case "$platform" in
        windows-*)
            ext=".exe"
            ;;
    esac

    local filename="${BIN_NAME}-${platform}${ext}"
    local url="https://github.com/${REPO}/releases/download/${version}/${filename}"

    info "Downloading ${BIN_NAME} ${version} for ${platform}..."

    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "$url" -o "$dest"
    elif command -v wget >/dev/null 2>&1; then
        wget -q "$url" -O "$dest"
    else
        error "Neither curl nor wget found."
    fi

    if [ ! -f "$dest" ]; then
        error "Download failed. Binary not found at: $url"
    fi
}

install_binary() {
    local src="$1"
    local bin_dir="$2"
    local dest="${bin_dir}/${BIN_NAME}"

    # Create bin directory if it doesn't exist
    if [ ! -d "$bin_dir" ]; then
        info "Creating directory: $bin_dir"
        mkdir -p "$bin_dir" 2>/dev/null || sudo mkdir -p "$bin_dir"
    fi

    # Check if we need sudo
    if [ -w "$bin_dir" ]; then
        mv "$src" "$dest"
        chmod +x "$dest"
    else
        info "Requesting sudo access to install to $bin_dir"
        sudo mv "$src" "$dest"
        sudo chmod +x "$dest"
    fi

    info "Installed ${BIN_NAME} to ${dest}"
}

verify_install() {
    local bin_dir="$1"
    local bin_path="${bin_dir}/${BIN_NAME}"

    if [ ! -x "$bin_path" ]; then
        error "Installation verification failed: binary not executable"
    fi

    # Try to run --version
    if "$bin_path" --version >/dev/null 2>&1; then
        local version=$("$bin_path" --version 2>&1)
        info "Successfully installed: ${version}"
    else
        warn "Binary installed but --version check failed. The binary may not be compatible with your system."
    fi

    # Check if bin_dir is in PATH
    case ":$PATH:" in
        *":${bin_dir}:"*)
            ;;
        *)
            warn "${bin_dir} is not in your PATH."
            echo ""
            echo "Add it to your PATH by running:"
            echo "  export PATH=\"${bin_dir}:\$PATH\""
            echo ""
            echo "Or add this line to your shell profile (~/.bashrc, ~/.zshrc, etc.)"
            ;;
    esac
}

main() {
    local bin_dir="$DEFAULT_BIN_DIR"
    local version=""

    # Parse arguments
    while [ $# -gt 0 ]; do
        case "$1" in
            -b|--bin-dir)
                bin_dir="$2"
                shift 2
                ;;
            -v|--version)
                version="$2"
                shift 2
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                error "Unknown option: $1. Use -h for help."
                ;;
        esac
    done

    # Detect platform
    local platform
    platform=$(detect_platform)
    info "Detected platform: ${platform}"

    # Get version
    if [ -z "$version" ]; then
        info "Fetching latest version..."
        version=$(get_latest_version)
    fi
    info "Version: ${version}"

    # Create temp file for download
    local tmp_file
    tmp_file=$(mktemp)
    trap "rm -f '$tmp_file'" EXIT

    # Download
    download_binary "$version" "$platform" "$tmp_file"

    # Install
    install_binary "$tmp_file" "$bin_dir"

    # Verify
    verify_install "$bin_dir"

    echo ""
    info "Installation complete! Run 'mdview --help' to get started."
}

main "$@"
