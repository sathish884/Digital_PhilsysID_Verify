
import subprocess

def run_docker_command(command):
    try:
        # Execute the Docker command and capture the output
        result = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        return f"Error: {e.stderr}"

def remove_container(container_name):
    # Stop and remove the container
    stop_command = f"docker stop {container_name}"
    remove_command = f"docker rm {container_name}"

    # Stop the container if it's running
    print(f"Stopping container: {container_name}")
    print(run_docker_command(stop_command))

    # Remove the container
    print(f"Removing container: {container_name}")
    print(run_docker_command(remove_command))

def build_docker_image(image_name, dockerfile_path='.'):
    """Build a new Docker image from a Dockerfile."""
    build_command = f"docker build -t {image_name} {dockerfile_path}"

    # Build the image
    print(f"Building Docker image: {image_name}")
    print(run_docker_command(build_command))

def push_docker_image(image_name, registry_url=None):
    """Push the Docker image to a registry."""
    if registry_url:
        # Tag the image for a specific registry (e.g., Docker Hub)
        tag_command = f"docker tag {image_name} {registry_url}/{image_name}"
        print(f"Tagging image: {image_name} as {registry_url}/{image_name}")
        print(run_docker_command(tag_command))
        image_name = f"{registry_url}/{image_name}"

    push_command = f"docker push {image_name}"

    # Push the image to the registry
    print(f"Pushing Docker image to registry: {image_name}")
    print(run_docker_command(push_command))

def deploy_container(image_name, container_name, ports_mapping=""):
    # Deploy a new container from the specified image
    deploy_command = f"docker run -d --name {container_name} {ports_mapping} {image_name}"

    # Run the deploy command
    print(f"Deploying container {container_name} from image {image_name}")
    print(run_docker_command(deploy_command))

# Example usage:
container_name = "Malawi_IMS_UI"
image_name = "malawi_ims-ui:1.1"  # Use your desired Docker image
ports_mapping = "-e TZ=Asia/Kolkata --restart=unless-stopped -p 80:80 -p 443:443"  # Map container's port 80 to host port 8080 (optional)
dockerfile_path = '.'
registry_url = "mspeagle"
# Remove the old container and deploy a new one

remove_container(container_name)
build_docker_image(image_name, dockerfile_path)
#if registry_url:
#    push_docker_image(image_name, registry_url)
deploy_container(image_name, container_name, ports_mapping)
