# make base image so I don't have to keep redownloading the sam dependencies whenever mine change
FROM pytorch/pytorch:2.4.0-cuda12.4-cudnn9-devel as sam-base

# needed for sam cloning
RUN apt-get update && apt-get install -y git wget

# undeclared dependency of sam 2
RUN python3 -m pip install wheel 

# clone sam
WORKDIR /cachedRepos/
RUN git clone https://github.com/facebookresearch/segment-anything-2.git
WORKDIR /cachedRepos/segment-anything-2/checkpoints
RUN bash download_ckpts.sh
WORKDIR /cachedRepos/segment-anything-2/
RUN python3 -m pip install -e .
RUN python3 -m pip install -e ".[demo]"


FROM sam-base AS backend-server
WORKDIR /

# nice to have 
RUN apt-get install -y fish

# needed for cv2 runtime
RUN apt-get install -y ffmpeg libsm6 libxext6

# get vs code server
RUN apt-get install -y curl
COPY install_vscode_server.bash .

# run once for each version of vs code we want to support
RUN bash install_vscode_server.bash b1c0a14de1414fcdaa400695b4db1c0799bc3124

RUN rm install_vscode_server.bash

# break caching of the git clone
# run build with `--build-arg CACHEBUST=$(date +%s)` to force recloning of repo
ARG CACHEBUST=1
# clone my repo
WORKDIR /cachedRepos/
RUN git clone https://github.com/pitothepi/sam2-explorer.git
WORKDIR /cachedRepos/sam2-explorer/backend/source/
RUN python3 -m pip install -r requirements.txt

WORKDIR /repo/
# ENTRYPOINT [ "jupyter", "lab", "--allow-root", "--ip=0.0.0.0" ]